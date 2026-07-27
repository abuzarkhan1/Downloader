import os
import re
import logging
from pathlib import Path
from typing import Optional
import yt_dlp

from app.config import settings
from app.services.storage import storage_manager
from app.services.job_store import job_store
from app.services.ffmpeg_utils import get_ffmpeg_location, is_ffmpeg_available
from app.services.extractor import clean_error_message

logger = logging.getLogger(__name__)

def parse_quality_height(quality: str) -> Optional[str]:
    """Extract height integer string from quality parameter (e.g. '1080p' -> '1080')."""
    match = re.search(r'(\d+)', str(quality))
    return match.group(1) if match else None


def convert_subtitles_to_txt(sub_file: Path) -> Path:
    """Converts downloaded .srt or .vtt subtitle file to clean .txt file without timestamps/line numbers."""
    try:
        content = sub_file.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return sub_file

    lines = content.splitlines()
    cleaned_lines = []
    prev_line = None

    timestamp_pattern = re.compile(
        r'(\d{1,2}:)?\d{2}:\d{2}[\.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[\.,]\d{3}'
    )
    tag_pattern = re.compile(r'<[^>]+>')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("WEBVTT") or stripped.startswith("Kind:") or stripped.startswith("Language:") or stripped.startswith("NOTE"):
            continue
        if stripped.isdigit():  # Subtitle index line in SRT
            continue
        if timestamp_pattern.search(stripped):
            continue

        text = tag_pattern.sub("", stripped).strip()
        if not text:
            continue

        if text != prev_line:
            cleaned_lines.append(text)
            prev_line = text

    txt_file = sub_file.with_suffix(".txt")
    txt_file.write_text("\n".join(cleaned_lines), encoding="utf-8")
    if sub_file != txt_file and sub_file.exists():
        sub_file.unlink(missing_ok=True)
    return txt_file


def execute_download(
    download_job_id: str,
    url: str,
    format_type: str,
    quality: str,
    ffmpeg_location: Optional[str] = None,
    audio_ext: Optional[str] = None,
    ext: Optional[str] = None,
    subtitle_lang: Optional[str] = None,
    subtitle_ext: Optional[str] = None,
    remove_watermark: bool = True,
) -> str:
    """
    Executes yt-dlp download & ffmpeg postprocessing.
    Supports video, audio (mp3, m4a, wav), and subtitle (srt, vtt, txt) processing.
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
        "no_color": True,
        "geo_bypass": True,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"],
            },
        },
    }

    ffmpeg_loc = ffmpeg_location or get_ffmpeg_location()
    if ffmpeg_loc:
        ydl_opts["ffmpeg_location"] = ffmpeg_loc

    has_ffmpeg = is_ffmpeg_available(ffmpeg_loc)
    fmt_type = format_type.lower()

    if fmt_type == "audio":
        ydl_opts["format"] = "bestaudio/best"
        target_ext = (ext or audio_ext or "mp3").lower()
        if quality.lower() in ["wav", "m4a", "mp3"]:
            target_ext = quality.lower()

        if has_ffmpeg:
            bitrate = "192"
            bitrate_match = re.search(r'(\d+)', quality)
            if bitrate_match:
                bitrate = bitrate_match.group(1)

            postprocessor = {
                "key": "FFmpegExtractAudio",
                "preferredcodec": target_ext,
            }
            if target_ext in ["mp3", "m4a"]:
                postprocessor["preferredquality"] = bitrate
            ydl_opts["postprocessors"] = [postprocessor]

    elif fmt_type == "subtitle":
        lang = subtitle_lang or "en"
        sub_ext = (ext or subtitle_ext or "srt").lower()

        ydl_opts["skip_download"] = True
        ydl_opts["writesubtitles"] = True
        ydl_opts["writeautomaticsub"] = True
        ydl_opts["subtitleslangs"] = [lang]

        if sub_ext in ["srt", "vtt"]:
            ydl_opts["subtitlesformat"] = sub_ext
            if has_ffmpeg:
                ydl_opts["postprocessors"] = [{
                    "key": "FFmpegSubtitlesConvertor",
                    "format": sub_ext,
                }]
        else:  # txt or fallback
            ydl_opts["subtitlesformat"] = "vtt/srt/best"

    else:
        # Video format selection
        height = parse_quality_height(quality)
        if has_ffmpeg and height:
            ydl_opts["format"] = f"bestvideo[height<={height}]+bestaudio/best[height<={height}]/bestvideo+bestaudio/best"
            ydl_opts["merge_output_format"] = "mp4"
        elif height:
            ydl_opts["format"] = f"best[height<={height}]/best"
        else:
            ydl_opts["format"] = "best/bestvideo+bestaudio"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if not info:
                raise Exception("yt-dlp failed to extract info or download media")

            # Resolve downloaded file path
            if "requested_downloads" in info and len(info["requested_downloads"]) > 0:
                downloaded_file = Path(info["requested_downloads"][0]["filepath"])
            else:
                downloaded_file = Path(ydl.prepare_filename(info))

            if not downloaded_file.exists():
                # Search job directory for any newly created file
                files = list(job_dir.glob("*"))
                if files:
                    downloaded_file = files[0]
                else:
                    raise Exception("Downloaded media file not found on disk")

            # Post-process subtitle conversion to .txt if requested
            if fmt_type == "subtitle" and (ext == "txt" or subtitle_ext == "txt"):
                downloaded_file = convert_subtitles_to_txt(downloaded_file)

            storage_manager.register_file(download_job_id, str(downloaded_file))
            file_url = f"{settings.BASE_URL}/api/v1/files/{download_job_id}"
            job_store.set_job_ready(download_job_id, file_url)
            logger.info(f"Download job {download_job_id} successfully finished: {file_url}")
            return file_url

    except Exception as e:
        logger.error(f"Download job {download_job_id} failed: {e}", exc_info=True)
        cleaned_msg = clean_error_message(str(e))
        job_store.set_job_failed(download_job_id, cleaned_msg)
        raise Exception(cleaned_msg)
