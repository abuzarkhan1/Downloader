import os
import re
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
import yt_dlp
import mutagen
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, ID3NoHeaderError

from app.config import settings
from app.services.storage import storage_manager
from app.services.job_store import job_store
from app.services.ffmpeg_utils import get_ffmpeg_location, is_ffmpeg_available

logger = logging.getLogger(__name__)

FORBIDDEN_FLAG_PREFIXES = (
    "--exec",
    "--external-downloader",
    "--batch-file",
    "--config-location",
    "--plugin-dirs",
    "--cache-dir",
    "--cookies",
)


def embed_metadata_with_mutagen(file_path: str, title: Optional[str] = None, uploader: Optional[str] = None) -> None:
    """
    Enriches audio metadata using mutagen.
    """
    try:
        ext = Path(file_path).suffix.lower()
        if ext == ".mp3":
            try:
                audio = EasyID3(file_path)
            except ID3NoHeaderError:
                audio = mutagen.File(file_path, easy=True)
                audio.add_tags()
            if title:
                audio["title"] = title
            if uploader:
                audio["artist"] = uploader
            audio.save()
        elif ext == ".m4a":
            audio = mutagen.File(file_path)
            if audio is not None:
                if title:
                    audio["\xa9nam"] = [title]
                if uploader:
                    audio["\xa9ART"] = [uploader]
                audio.save()
        elif ext == ".flac":
            audio = mutagen.File(file_path)
            if audio is not None:
                if title:
                    audio["title"] = [title]
                if uploader:
                    audio["artist"] = [uploader]
                audio.save()
    except Exception as e:
        logger.warning(f"Mutagen metadata embedding warning for {file_path}: {e}")


def apply_custom_flags(ydl_opts: Dict[str, Any], custom_flags: Optional[List[str]]) -> None:
    """
    Applies custom safe yt-dlp flag templates.
    """
    if not custom_flags:
        return
    for flag in custom_flags:
        flag_clean = flag.strip()
        if any(flag_clean.startswith(forbidden) for forbidden in FORBIDDEN_FLAG_PREFIXES):
            logger.warning(f"Ignored forbidden yt-dlp flag: {flag_clean}")
            continue

        if flag_clean == "--geo-bypass":
            ydl_opts["geo_bypass"] = True
        elif flag_clean == "--no-playlist":
            ydl_opts["noplaylist"] = True
        elif flag_clean == "--yes-playlist":
            ydl_opts["noplaylist"] = False
        elif flag_clean == "--prefer-free-formats":
            ydl_opts["prefer_free_formats"] = True
        elif flag_clean == "--no-mtime":
            ydl_opts["updatetime"] = False
        elif flag_clean == "--write-description":
            ydl_opts["writedescription"] = True
        elif flag_clean == "--write-info-json":
            ydl_opts["writeinfojson"] = True
        elif flag_clean == "--embed-metadata":
            ydl_opts["addmetadata"] = True
        elif flag_clean == "--embed-thumbnail":
            ydl_opts["writethumbnail"] = True
        elif flag_clean == "--keep-video":
            ydl_opts["keepvideo"] = True


def parse_quality_height(quality: str) -> Optional[str]:
    """Extract height integer string from quality parameter (e.g. '1080p' -> '1080')."""
    match = re.search(r'(\d+)', str(quality))
    return match.group(1) if match else None


def parse_audio_bitrate(audio_bitrate: Optional[str], quality: str) -> str:
    """Parses audio bitrate integer string ('128', '192', '320')."""
    if audio_bitrate:
        match = re.search(r'(\d+)', str(audio_bitrate))
        if match:
            return match.group(1)
    if "kbps" in str(quality).lower():
        match = re.search(r'(\d+)', str(quality))
        if match:
            return match.group(1)
    return "192"


def execute_download(
    download_job_id: str,
    url: str,
    format_type: str,
    quality: str,
    ffmpeg_location: Optional[str] = None,
    audio_codec: Optional[str] = None,
    audio_bitrate: Optional[str] = None,
    extract_subtitles: bool = False,
    subtitle_lang: Optional[str] = "en",
    sponsorblock_remove: bool = False,
    custom_flags: Optional[List[str]] = None,
) -> str:
    """
    Executes yt-dlp download & ffmpeg postprocessing.
    Updates job_store progress and registers resulting file with storage_manager.
    Returns path to downloaded media file.
    """
    job_store.update_job_progress(download_job_id, 5.0, status="processing")
    job_dir = storage_manager.get_job_dir(download_job_id)
    out_template = str(job_dir / "%(title)s.%(ext)s")

    def progress_hook(d):
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes") or 0
            if total > 0:
                pct = 5.0 + (downloaded / total) * 85.0
                job_store.update_job_progress(download_job_id, pct, status="processing")
        elif d.get("status") == "finished":
            job_store.update_job_progress(download_job_id, 95.0, status="processing")

    ydl_opts = {
        "outtmpl": out_template,
        "progress_hooks": [progress_hook],
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "writethumbnail": True,
    }

    ffmpeg_loc = ffmpeg_location or get_ffmpeg_location()
    if ffmpeg_loc:
        ydl_opts["ffmpeg_location"] = ffmpeg_loc

    has_ffmpeg = is_ffmpeg_available(ffmpeg_loc)
    postprocessors = []

    # Subtitle Extraction and Embedding (--write-sub, --write-auto-sub, --sub-format srt/vtt)
    if extract_subtitles:
        ydl_opts["writesubtitles"] = True
        ydl_opts["writeautomaticsub"] = True
        ydl_opts["subtitlesformat"] = "srt/vtt/best"
        lang = subtitle_lang if subtitle_lang else "en"
        ydl_opts["subtitleslangs"] = [lang, "en"]
        if has_ffmpeg and format_type.lower() == "video":
            postprocessors.append({"key": "FFmpegEmbedSubtitle"})

    # SponsorBlock segment removal (--sponsorblock-remove all)
    if sponsorblock_remove:
        ydl_opts["sponsorblock_remove"] = ["all"]

    if format_type.lower() == "audio":
        ydl_opts["format"] = "bestaudio/best"
        codec = audio_codec.lower() if audio_codec else "mp3"
        bitrate_str = parse_audio_bitrate(audio_bitrate, quality)
        if has_ffmpeg:
            postprocessors.append({
                "key": "FFmpegExtractAudio",
                "preferredcodec": codec,
                "preferredquality": bitrate_str,
            })
            postprocessors.append({"key": "FFmpegMetadata", "add_metadata": True})
            postprocessors.append({"key": "FFmpegThumbnailsConvertor", "format": "jpg"})
    else:
        # Video format selection
        height = parse_quality_height(quality)
        if has_ffmpeg:
            if height:
                ydl_opts["format"] = f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
            else:
                ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
            ydl_opts["merge_output_format"] = "mp4"
            postprocessors.append({"key": "FFmpegMetadata", "add_metadata": True})
            postprocessors.append({"key": "FFmpegThumbnailsConvertor", "format": "jpg"})
        else:
            if height:
                ydl_opts["format"] = f"best[height<={height}][ext=mp4]/best[height<={height}]/best[ext=mp4]/best"
            else:
                ydl_opts["format"] = "best[ext=mp4]/best"

    if postprocessors:
        ydl_opts["postprocessors"] = postprocessors

    # Apply custom safe flags
    apply_custom_flags(ydl_opts, custom_flags)

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Locate the downloaded file in job_dir
        downloaded_media = [
            f for f in job_dir.glob("*")
            if f.is_file() and f.suffix.lower() not in [".vtt", ".srt", ".json", ".jpg", ".png", ".webp"]
        ]
        if not downloaded_media:
            downloaded_files = [f for f in job_dir.glob("*") if f.is_file()]
            if not downloaded_files:
                raise FileNotFoundError("No output file generated by yt-dlp download process.")
            downloaded_media = downloaded_files

        final_file = downloaded_media[0]

        # Enrich audio metadata with mutagen if applicable
        job_info = job_store.get_job(download_job_id) or {}
        title = job_info.get("title")
        uploader = job_info.get("uploader")
        embed_metadata_with_mutagen(str(final_file), title=title, uploader=uploader)


        storage_manager.register_file(download_job_id, str(final_file))
        
        file_url = f"{settings.BASE_URL}/api/v1/files/{download_job_id}"
        job_store.set_job_ready(download_job_id, file_url)
        logger.info(f"Job {download_job_id} successfully downloaded to {final_file}")
        return str(final_file)

    except Exception as e:
        err_str = str(e)
        if "ffmpeg not found" in err_str.lower() or "ffprobe and ffmpeg not found" in err_str.lower():
            friendly_err = "Audio conversion / video merging requires ffmpeg. Please install ffmpeg."
            logger.error(f"Download job {download_job_id} failed: {friendly_err}")
            job_store.set_job_failed(download_job_id, friendly_err)
            raise Exception(friendly_err) from e
        else:
            logger.error(f"Download job {download_job_id} failed: {e}", exc_info=True)
            job_store.set_job_failed(download_job_id, err_str)
            raise e

