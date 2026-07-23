import yt_dlp
from typing import Dict, Any, List
from app.schemas.analyze import VideoFormat, AudioFormat


class ExtractionError(Exception):
    def __init__(self, error_code: str, message: str, status_code: int = 400):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _format_video_qualities(formats: List[Dict[str, Any]], duration: int) -> List[VideoFormat]:
    """
    Parses yt-dlp format entries and returns standardized list of VideoFormat objects
    sorted by highest quality first.
    """
    qualities_seen = set()
    result: List[VideoFormat] = []

    # Candidates sorted by height desc, fps desc, filesize desc
    valid_formats = []
    for f in formats:
        # Must have video stream
        if f.get("vcodec") == "none":
            continue

        height = f.get("height")
        if not height or not isinstance(height, int) or height <= 0:
            # Fallback check on format_note or resolution string if height missing
            fmt_note = str(f.get("format_note") or "")
            if "1080" in fmt_note:
                height = 1080
            elif "720" in fmt_note:
                height = 720
            elif "480" in fmt_note:
                height = 480
            elif "360" in fmt_note:
                height = 360
            elif "240" in fmt_note:
                height = 240
            elif "144" in fmt_note:
                height = 144
            else:
                continue

        quality_label = f"{height}p"
        fps = int(f.get("fps") or 30)

        # Filesize calculation or estimation
        filesize = f.get("filesize") or f.get("filesize_approx")
        if filesize:
            filesize_mb = round(filesize / (1024 * 1024), 1)
        else:
            # Estimate based on duration and approximate bitrates per height
            tbr = f.get("tbr")
            if tbr:
                filesize_mb = round((tbr * 1000 / 8 * duration) / (1024 * 1024), 1)
            else:
                # Default estimate lookup per height
                bitrate_map = {2160: 15000, 1440: 8000, 1080: 4000, 720: 2500, 480: 1200, 360: 750, 240: 400, 144: 250}
                est_br = bitrate_map.get(height, 2000)
                filesize_mb = round((est_br * 1000 / 8 * max(duration, 1)) / (1024 * 1024), 1)

        valid_formats.append((height, quality_label, filesize_mb, fps))

    # Sort candidates by height descending
    valid_formats.sort(key=lambda x: (x[0], x[3], x[2]), reverse=True)

    for height, quality_label, filesize_mb, fps in valid_formats:
        if quality_label not in qualities_seen:
            qualities_seen.add(quality_label)
            result.append(
                VideoFormat(
                    quality=quality_label,
                    ext="mp4",
                    filesize_mb=max(filesize_mb, 0.5),
                    fps=fps,
                )
            )

    # Fallback if no specific height streams detected but content is valid
    if not result:
        result.append(
            VideoFormat(
                quality="720p",
                ext="mp4",
                filesize_mb=round(max(duration * 0.5, 5.0), 1),
                fps=30,
            )
        )

    return result


def _format_audio_qualities(formats: List[Dict[str, Any]], duration: int) -> List[AudioFormat]:
    """Generates standard audio formats (MP3 192kbps)."""
    # Calculate audio file size for 192kbps MP3
    # 192 kbps = 192,000 bits/sec = 24,000 bytes/sec
    filesize_mb = round((24000 * max(duration, 1)) / (1024 * 1024), 1)
    if filesize_mb <= 0:
        filesize_mb = 1.5

    return [
        AudioFormat(
            quality="192kbps",
            ext="mp3",
            filesize_mb=filesize_mb,
        )
    ]


def _extract_subtitles(info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extracts subtitle and caption tracks from yt-dlp info dictionary.
    Returns list of dicts: [{"lang": "en", "name": "English", "is_auto": False}, ...]
    """
    subtitles_list = []
    seen_langs = set()

    # Manual / official subtitles
    subs = info.get("subtitles") or {}
    for lang, tracks in subs.items():
        name = lang
        if isinstance(tracks, list) and len(tracks) > 0 and isinstance(tracks[0], dict):
            name = tracks[0].get("name") or lang
        subtitles_list.append({
            "lang": lang,
            "name": name,
            "is_auto": False,
        })
        seen_langs.add(lang)

    # Automatic captions
    auto_subs = info.get("automatic_captions") or {}
    for lang, tracks in auto_subs.items():
        if lang not in seen_langs:
            name = lang
            if isinstance(tracks, list) and len(tracks) > 0 and isinstance(tracks[0], dict):
                name = tracks[0].get("name") or f"{lang} (auto)"
            subtitles_list.append({
                "lang": lang,
                "name": name,
                "is_auto": True,
            })
            seen_langs.add(lang)

    return subtitles_list


def extract_media_info(url: str, platform: str) -> Dict[str, Any]:
    """
    Extracts media metadata using yt-dlp safely (without downloading payload).
    Raises ExtractionError on private/restricted/blocked content.
    Supports single videos and playlists.
    """
    ydl_opts = {
        "extract_flat": False,
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                raise ExtractionError(
                    error_code="EXTRACTION_FAILED",
                    message="Failed to retrieve video metadata.",
                    status_code=422,
                )

            is_playlist = False
            playlist_items = []
            entries = []

            raw_entries = info.get("entries")
            if raw_entries is not None or info.get("_type") in ["playlist", "multi_video"]:
                is_playlist = True
                if raw_entries is not None:
                    entries = [e for e in list(raw_entries) if e is not None]
                    for entry in entries:
                        entry_id = entry.get("id") or ""
                        entry_url = entry.get("webpage_url") or entry.get("url") or (f"https://www.youtube.com/watch?v={entry_id}" if entry_id else "")
                        playlist_items.append({
                            "id": entry_id,
                            "title": entry.get("title") or "Untitled",
                            "url": entry_url,
                            "duration_seconds": int(entry.get("duration") or 0),
                            "thumbnail": entry.get("thumbnail") or "",
                            "uploader": entry.get("uploader") or entry.get("channel") or entry.get("uploader_id") or "",
                        })

            title = info.get("title") or (entries[0].get("title") if entries else "Untitled Media")
            thumbnail = info.get("thumbnail") or (entries[0].get("thumbnail") if entries else "")
            duration = int(info.get("duration") or (sum(int(e.get("duration") or 0) for e in entries) if entries else 0))
            uploader = info.get("uploader") or info.get("channel") or info.get("uploader_id") or (entries[0].get("uploader") if entries else "Unknown Uploader")

            raw_formats = info.get("formats", [])
            if not raw_formats and entries:
                raw_formats = entries[0].get("formats", [])

            video_formats = _format_video_qualities(raw_formats, duration)
            audio_formats = _format_audio_qualities(raw_formats, duration)

            subtitles = _extract_subtitles(info)
            if not subtitles and entries:
                subtitles = _extract_subtitles(entries[0])

            return {
                "platform": platform,
                "title": title,
                "thumbnail": thumbnail,
                "duration_seconds": duration,
                "uploader": uploader,
                "video_formats": video_formats,
                "audio_formats": audio_formats,
                "is_playlist": is_playlist,
                "playlist_items": playlist_items,
                "subtitles": subtitles,
                "raw_info": info,  # Retained in cache for Agent B to use yt-dlp format identifiers if needed
            }

    except yt_dlp.utils.DownloadError as e:
        err_msg = str(e).lower()

        if any(term in err_msg for term in ["private", "login", "requires authentication", "members-only", "sign in"]):
            raise ExtractionError(
                error_code="PRIVATE_CONTENT",
                message="This content is private or requires authentication and cannot be accessed.",
                status_code=403,
            )
        elif "too many requests" in err_msg or "rate limit" in err_msg or "429" in err_msg:
            raise ExtractionError(
                error_code="RATE_LIMITED",
                message="Platform rate limit reached. Please try again later.",
                status_code=429,
            )
        elif any(term in err_msg for term in ["bot", "blocked", "captcha"]):
            raise ExtractionError(
                error_code="PLATFORM_BLOCKED",
                message="Request was blocked by the platform.",
                status_code=422,
            )
        else:
            raise ExtractionError(
                error_code="EXTRACTION_FAILED",
                message=f"Unable to extract media info: {str(e)}",
                status_code=400,
            )
    except ExtractionError:
        raise
    except Exception as e:
        raise ExtractionError(
            error_code="EXTRACTION_FAILED",
            message=f"An unexpected error occurred during extraction: {str(e)}",
            status_code=500,
        )

