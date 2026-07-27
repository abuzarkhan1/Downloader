import re
import yt_dlp
from typing import Dict, Any, List, Optional
from app.schemas.analyze import VideoFormat, AudioFormat, SubtitleOption
from app.services.platform_detector import detect_platform


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

    valid_formats = []
    for f in formats:
        if f.get("vcodec") == "none":
            continue

        height = f.get("height")
        if not height or not isinstance(height, int) or height <= 0:
            fmt_note = str(f.get("format_note") or "")
            fmt_res = str(f.get("resolution") or "")
            fmt_str = f"{fmt_note} {fmt_res} {f.get('format_id', '')} {f.get('format', '')}"

            for h_candidate in [2160, 1440, 1080, 720, 480, 360, 240, 144]:
                if str(h_candidate) in fmt_str:
                    height = h_candidate
                    break

            if not height and f.get("width"):
                w = f.get("width")
                if isinstance(w, int) and w > 0:
                    height = int(w * 9 / 16)

            if not height or not isinstance(height, int) or height <= 0:
                continue

        quality_label = f"{height}p"
        fps = int(f.get("fps") or 30)

        filesize = f.get("filesize") or f.get("filesize_approx")
        if filesize:
            filesize_mb = round(filesize / (1024 * 1024), 1)
        else:
            tbr = f.get("tbr")
            if tbr:
                filesize_mb = round((tbr * 1000 / 8 * max(duration, 1)) / (1024 * 1024), 1)
            else:
                bitrate_map = {2160: 15000, 1440: 8000, 1080: 4000, 720: 2500, 480: 1200, 360: 750, 240: 400, 144: 250}
                est_br = bitrate_map.get(height, 2000)
                filesize_mb = round((est_br * 1000 / 8 * max(duration, 1)) / (1024 * 1024), 1)

        direct_url = f.get("url")
        valid_formats.append((height, quality_label, filesize_mb, fps, direct_url))

    valid_formats.sort(key=lambda x: (x[0], x[3], x[2]), reverse=True)

    for height, quality_label, filesize_mb, fps, direct_url in valid_formats:
        if quality_label not in qualities_seen:
            qualities_seen.add(quality_label)
            result.append(
                VideoFormat(
                    quality=quality_label,
                    ext="mp4",
                    filesize_mb=max(filesize_mb, 0.5),
                    fps=fps,
                    direct_url=direct_url,
                )
            )

    # Ensure standard quality suite (1080p, 720p, 480p, 360p) is available for user selection
    standard_defaults = [
        ("1080p", 45.2, 60),
        ("720p", 22.8, 30),
        ("480p", 12.1, 30),
        ("360p", 7.5, 30),
    ]

    for q_label, default_mb, default_fps in standard_defaults:
        if q_label not in qualities_seen:
            qualities_seen.add(q_label)
            est_mb = round(max(duration * (0.8 if q_label == "1080p" else 0.4 if q_label == "720p" else 0.2), 3.0), 1)
            result.append(
                VideoFormat(
                    quality=q_label,
                    ext="mp4",
                    filesize_mb=est_mb if duration > 0 else default_mb,
                    fps=default_fps,
                )
            )

    # Re-sort result by numeric resolution descending
    def get_res_num(vf: VideoFormat) -> int:
        match = re.search(r'\d+', vf.quality)
        return int(match.group()) if match else 0

    result.sort(key=get_res_num, reverse=True)
    return result


def _format_audio_qualities(formats: List[Dict[str, Any]], duration: int) -> List[AudioFormat]:
    """Generates audio format options for MP3 (128, 192, 320 kbps), M4A (128, 192, 256 kbps), and WAV."""
    dur = max(duration, 1)

    best_audio_url = None
    for f in sorted(formats, key=lambda x: x.get('abr') or 0, reverse=True):
        if f.get('vcodec') == 'none' and f.get('url'):
            best_audio_url = f.get('url')
            break

    specs = [
        ("mp3", "128kbps", round((16000 * dur) / (1024 * 1024), 1)),
        ("mp3", "192kbps", round((24000 * dur) / (1024 * 1024), 1)),
        ("mp3", "320kbps", round((40000 * dur) / (1024 * 1024), 1)),
        ("m4a", "128kbps", round((16000 * dur) / (1024 * 1024), 1)),
        ("m4a", "192kbps", round((24000 * dur) / (1024 * 1024), 1)),
        ("m4a", "256kbps", round((32000 * dur) / (1024 * 1024), 1)),
        ("wav", "lossless", round((176375 * dur) / (1024 * 1024), 1)),
    ]

    return [
        AudioFormat(
            quality=quality,
            ext=ext,
            filesize_mb=max(filesize_mb, 0.5),
            direct_url=best_audio_url,
        )
        for ext, quality, filesize_mb in specs
    ]


def clean_error_message(msg: str) -> str:
    """Strips ANSI color codes, CLI hints, and formats raw yt-dlp errors into clean, user-friendly UI messages."""
    cleaned = re.sub(r'\x1b\[[0-9;]*[mGKH]', '', msg)
    cleaned = re.sub(r'\[[0-9;]+m', '', cleaned)
    cleaned = re.sub(r'^ERROR:\s*', '', cleaned, flags=re.IGNORECASE).strip()

    # Strip yt-dlp platform tag e.g. [Instagram] DbBEJA3MC3g: or [youtube] dQw4w9WgXcQ:
    cleaned = re.sub(r'^\[[^\]]+\]\s*[^:\s]*:\s*', '', cleaned).strip()

    lowered = cleaned.lower()

    if any(k in lowered for k in ["empty media response", "accessible in your browser without being logged-in", "login", "api is not granting access"]):
        return "This Instagram post or Reel is private or restricted. Please ensure the link is publicly accessible."

    if any(k in lowered for k in ["private video", "this video is private"]):
        return "This video is private and cannot be downloaded."

    if any(k in lowered for k in ["sign in to confirm your age", "age-restricted"]):
        return "This content is age-restricted and requires account verification."

    # Strip yt-dlp github/cli URL hints and boilerplate text
    cleaned = re.sub(r'Check if this post is accessible.*$', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'See\s+https://github\.com/yt-dlp.*$', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'Otherwise, if the post is accessible.*$', '', cleaned, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'Confirm you are on the latest version.*$', '', cleaned, flags=re.DOTALL | re.IGNORECASE)

    return cleaned.strip()


def extract_media_info(url: str, platform: str, remove_watermark: bool = True) -> Dict[str, Any]:
    """
    Extracts media metadata using yt-dlp safely without downloading payload.
    Extracts manual and auto-captions, audio bitrates/codecs, and watermark parameters.
    Raises ExtractionError on private/restricted/blocked content.
    """
    ydl_opts: Dict[str, Any] = {
        "extract_flat": False,
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "no_color": True,
        "geo_bypass": True,
        "socket_timeout": 15,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "noplaylist": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"],
            },
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if remove_watermark:
        ydl_opts["extractor_args"]["tiktok"] = {
            "app_version": "20.2.1",
        }

    try:
        info = None
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
        except yt_dlp.utils.DownloadError as de:
            fallback_opts = {
                **ydl_opts,
                "extractor_args": {
                    "youtube": {
                        "player_client": ["tv", "android_vr", "web"],
                    },
                },
            }
            if remove_watermark:
                fallback_opts["extractor_args"]["tiktok"] = {"app_version": "20.2.1"}
            try:
                with yt_dlp.YoutubeDL(fallback_opts) as ydl_fb:
                    info = ydl_fb.extract_info(url, download=False)
            except Exception:
                raise de

        if not info:
            raise ExtractionError(
                error_code="EXTRACTION_FAILED",
                message="Failed to retrieve video metadata.",
                status_code=422,
            )

        title = info.get("title") or info.get("fulltitle") or "Untitled Media"

        thumbnail = info.get("thumbnail") or ""
        if not thumbnail and info.get("thumbnails"):
            thumbs = [t for t in info.get("thumbnails") if isinstance(t, dict) and t.get("url")]
            if thumbs:
                thumbnail = thumbs[-1].get("url") or ""

        # Normalize and clean thumbnail URL for reliable cross-platform image loading
        video_id = info.get("id")
        if video_id and ("ytimg.com" in thumbnail or "youtube.com" in thumbnail or platform == "youtube"):
            thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        elif thumbnail and thumbnail.startswith("//"):
            thumbnail = f"https:{thumbnail}"
        elif thumbnail and "i.ytimg.com" in thumbnail and "?sqp=" in thumbnail:
            thumbnail = thumbnail.split("?")[0]

        thumbnail_is_fallback = False
        # Ensure thumbnail is never empty by providing high quality platform fallback image URLs
        if not thumbnail or not isinstance(thumbnail, str) or not thumbnail.strip():
            if platform == "youtube" and video_id:
                thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
            elif platform == "tiktok":
                thumbnail = "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&q=80"
                thumbnail_is_fallback = True
            elif platform == "instagram":
                thumbnail = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80"
                thumbnail_is_fallback = True
            elif platform == "facebook":
                thumbnail = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                thumbnail_is_fallback = True
            elif platform == "twitter":
                thumbnail = "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&q=80"
                thumbnail_is_fallback = True
            else:
                thumbnail = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"
                thumbnail_is_fallback = True

        dur_raw = info.get("duration")
        duration = 0
        if dur_raw is not None:
            try:
                duration = int(float(dur_raw))
            except (ValueError, TypeError):
                duration = 0

        uploader = (
            info.get("uploader")
            or info.get("channel")
            or info.get("uploader_id")
            or info.get("creator")
            or info.get("user")
            or info.get("user_name")
            or info.get("extractor_key")
            or "Unknown Uploader"
        )

        raw_formats = info.get("formats", [])
        video_formats = _format_video_qualities(raw_formats, duration)
        audio_formats = _format_audio_qualities(raw_formats, duration)

        subtitles: List[SubtitleOption] = []
        seen_langs = set()

        raw_subs = info.get("subtitles") or {}
        if isinstance(raw_subs, dict):
            for lang_code, fmt_list in raw_subs.items():
                lang_str = str(lang_code)
                name = lang_str
                if fmt_list and isinstance(fmt_list, list) and len(fmt_list) > 0 and isinstance(fmt_list[0], dict):
                    name = fmt_list[0].get("name") or lang_str
                subtitles.append(SubtitleOption(lang=lang_str, name=str(name), is_auto=False))
                seen_langs.add(lang_str)

        raw_auto = info.get("automatic_captions") or {}
        if isinstance(raw_auto, dict):
            for lang_code, fmt_list in raw_auto.items():
                lang_str = str(lang_code)
                if lang_str not in seen_langs:
                    name = lang_str
                    if fmt_list and isinstance(fmt_list, list) and len(fmt_list) > 0 and isinstance(fmt_list[0], dict):
                        name = fmt_list[0].get("name") or lang_str
                    subtitles.append(SubtitleOption(lang=lang_str, name=str(name), is_auto=True))
                    seen_langs.add(lang_str)

        return {
            "platform": platform,
            "title": title,
            "thumbnail": thumbnail,
            "thumbnail_is_fallback": thumbnail_is_fallback,
            "duration_seconds": duration,
            "uploader": uploader,
            "video_formats": video_formats,
            "audio_formats": audio_formats,
            "subtitles": subtitles,
            "raw_info": info,
        }

    except yt_dlp.utils.DownloadError as e:
        cleaned_msg = clean_error_message(str(e))
        err_msg = cleaned_msg.lower()

        if any(term in err_msg for term in ["private", "login", "requires authentication", "members-only", "sign in", "empty media response", "accessible in your browser without being logged-in"]):
            raise ExtractionError(
                error_code="PRIVATE_CONTENT",
                message="This content is private or requires authentication and cannot be accessed.",
                status_code=403,
            )
        elif any(term in err_msg for term in ["too many requests", "rate limit", "429", "bot", "blocked", "captcha"]):
            raise ExtractionError(
                error_code="RATE_LIMITED",
                message="Platform rate limit or IP block reached. Please try again later.",
                status_code=429,
            )
        elif any(term in err_msg for term in ["deleted", "unavailable", "not found", "404", "video is no longer available"]):
            raise ExtractionError(
                error_code="MEDIA_NOT_FOUND",
                message="The requested media was deleted or is unavailable.",
                status_code=404,
            )
        elif any(term in err_msg for term in ["timeout", "timed out", "unreachable", "name or service not known", "network is unreachable", "504"]):
            raise ExtractionError(
                error_code="UPSTREAM_TIMEOUT",
                message="Network timeout or upstream server is unreachable.",
                status_code=504,
            )
        elif any(term in err_msg for term in ["500", "502", "corrupt", "internal server error", "bad gateway"]):
            raise ExtractionError(
                error_code="UPSTREAM_ERROR",
                message="Upstream platform error or corrupt response.",
                status_code=502,
            )
        elif "unsupported url" in err_msg or "is not a valid url" in err_msg or "invalid url" in err_msg:
            raise ExtractionError(
                error_code="UNSUPPORTED_URL",
                message="The provided URL is not supported or contains no downloadable media.",
                status_code=400,
            )
        else:
            raise ExtractionError(
                error_code="EXTRACTION_FAILED",
                message=cleaned_msg if cleaned_msg else "Unable to extract media info from the provided URL.",
                status_code=400,
            )
    except yt_dlp.utils.ExtractorError as e:
        raise ExtractionError(error_code="EXTRACTION_FAILED", message=str(e), status_code=400)
    except yt_dlp.utils.GeoRestrictedError as e:
        raise ExtractionError(error_code="PRIVATE_CONTENT", message=str(e), status_code=403)
    except yt_dlp.utils.UnavailableVideoError as e:
        raise ExtractionError(error_code="MEDIA_NOT_FOUND", message=str(e), status_code=404)
    except yt_dlp.utils.UserNotLive as e:
        raise ExtractionError(error_code="MEDIA_NOT_FOUND", message=str(e), status_code=404)
    except yt_dlp.utils.PostProcessingError as e:
        raise ExtractionError(error_code="CONVERSION_FAILED", message=str(e), status_code=500)
    except ExtractionError:
        raise
    except Exception as e:
        raise ExtractionError(
            error_code="EXTRACTION_FAILED",
            message=f"An unexpected error occurred during extraction: {str(e)}",
            status_code=500,
        )


def extract_playlist_or_batch_info(url_input: Any, remove_watermark: bool = True) -> Dict[str, Any]:
    """
    Extracts media info for playlists or multi-link batch requests.
    Supports list of URLs or single URL (playlist URL or multi-line URLs string).
    """
    urls_to_process: List[str] = []
    if isinstance(url_input, list):
        for item in url_input:
            if item and isinstance(item, str):
                urls_to_process.extend([line.strip() for line in item.splitlines() if line.strip()])
    elif isinstance(url_input, str):
        urls_to_process = [line.strip() for line in url_input.splitlines() if line.strip()]

    if not urls_to_process:
        raise ExtractionError(
            error_code="INVALID_REQUEST",
            message="No valid URLs provided for batch analysis.",
            status_code=400,
        )

    if len(urls_to_process) == 1:
        single_url = urls_to_process[0]
        ydl_opts = {
            "extract_flat": "in_playlist",
            "skip_download": True,
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "geo_bypass": True,
            "socket_timeout": 15,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                flat_info = ydl.extract_info(single_url, download=False)
                if flat_info and (flat_info.get("_type") == "playlist" or "entries" in flat_info):
                    playlist_title = flat_info.get("title") or "Playlist"
                    entries = flat_info.get("entries") or []
                    items = []
                    for entry in entries:
                        if not entry:
                            continue
                        item_url = entry.get("url") or entry.get("webpage_url")
                        if not item_url and entry.get("id"):
                            item_url = f"https://www.youtube.com/watch?v={entry.get('id')}"
                        if item_url:
                            item_platform = detect_platform(item_url) or "youtube"
                            try:
                                info = extract_media_info(item_url, item_platform, remove_watermark=remove_watermark)
                                items.append(info)
                            except Exception:
                                continue
                    if items:
                        return {
                            "playlist_title": playlist_title,
                            "total_items": len(items),
                            "items": items,
                        }
        except Exception:
            pass

    items = []
    for u in urls_to_process:
        platform = detect_platform(u)
        if not platform:
            continue
        try:
            info = extract_media_info(u, platform, remove_watermark=remove_watermark)
            items.append(info)
        except Exception:
            continue

    return {
        "playlist_title": None,
        "total_items": len(items),
        "items": items,
    }
