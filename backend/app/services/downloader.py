import os
import re
import logging
from pathlib import Path
from typing import Optional
import yt_dlp
import shutil

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
        "updatetime": False,
    }

    if shutil.which('aria2c'):
        ydl_opts["external_downloader"] = "aria2c"
        ydl_opts["external_downloader_args"] = ["-x", "16", "-s", "16", "-k", "1M"]

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

            postprocessors = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": target_ext,
                "preferredquality": bitrate if target_ext in ["mp3", "m4a"] else "192",
            }]
            
            # Add metadata and thumbnail embedding
            has_ffprobe = shutil.which('ffprobe') is not None
            postprocessing_list = [{"key": "FFmpegMetadata", "add_metadata": True}]
            if has_ffprobe:
                ydl_opts["writethumbnail"] = True
                postprocessing_list.extend([
                    {"key": "FFmpegThumbnailsConvertor", "format": "jpg"},
                    {"key": "EmbedThumbnail"}
                ])
            postprocessors.extend(postprocessing_list)
            ydl_opts["postprocessors"] = postprocessors

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
        if has_ffmpeg:
            if height:
                ydl_opts["format"] = f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]/best"
            else:
                ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
            ydl_opts["merge_output_format"] = "mp4"
        else:
            if height:
                ydl_opts["format"] = f"best[height<={height}][ext=mp4]/best[height<={height}]/best[ext=mp4]/best"
            else:
                ydl_opts["format"] = "best[ext=mp4]/best"
            
        if has_ffmpeg:
            has_ffprobe = shutil.which('ffprobe') is not None
            video_postproc = [{"key": "FFmpegMetadata", "add_metadata": True}]
            if has_ffprobe:
                ydl_opts["writethumbnail"] = True
                video_postproc.extend([
                    {"key": "FFmpegThumbnailsConvertor", "format": "jpg"},
                    {"key": "EmbedThumbnail"}
                ])
            ydl_opts["postprocessors"] = ydl_opts.get("postprocessors", []) + video_postproc

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Locate the downloaded file in job_dir
        downloaded_files = [f for f in job_dir.glob("*") if f.is_file() and not f.name.endswith(".jpg") and not f.name.endswith(".webp") and not f.name.endswith(".png")]
        if not downloaded_files:
            raise FileNotFoundError("No output file generated by yt-dlp download process.")
            
        final_file = downloaded_files[0]

        # Post-process subtitle conversion to .txt if requested
        if fmt_type == "subtitle" and (ext == "txt" or subtitle_ext == "txt"):
            final_file = convert_subtitles_to_txt(final_file)

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
        
        cleaned_msg = clean_error_message(err_str)
        err_msg = cleaned_msg.lower()
        
        if any(term in err_msg for term in ["private", "login", "requires authentication", "members-only", "sign in", "empty media response"]):
            job_store.set_job_failed(download_job_id, cleaned_msg)
            raise Exception(cleaned_msg) from e
        elif any(term in err_msg for term in ["too many requests", "rate limit", "429"]):
            job_store.set_job_failed(download_job_id, cleaned_msg)
            raise Exception(cleaned_msg) from e
        else:
            logger.error(f"Download job {download_job_id} failed: {e}", exc_info=True)
            job_store.set_job_failed(download_job_id, cleaned_msg)
            raise Exception(cleaned_msg) from e
