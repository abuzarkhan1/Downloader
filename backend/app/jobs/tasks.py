import logging
from fastapi import BackgroundTasks
from app.jobs.celery_app import celery_app, is_celery_available
from app.services.downloader import execute_download

from typing import Optional, List

logger = logging.getLogger(__name__)

@celery_app.task(name="app.jobs.tasks.download_media_task")
def download_media_task(
    download_job_id: str,
    url: str,
    format_type: str,
    quality: str,
    audio_codec: Optional[str] = None,
    audio_bitrate: Optional[str] = None,
    extract_subtitles: bool = False,
    subtitle_lang: Optional[str] = "en",
    sponsorblock_remove: bool = False,
    custom_flags: Optional[List[str]] = None,
    remux_mkv: bool = False,
    crop_artwork: bool = True,
    embed_subtitles: bool = False,
    cookies_str: Optional[str] = None,
    proxy_url: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    max_filesize: Optional[str] = None,
    rate_limit: Optional[str] = None,
    restrict_filenames: bool = False,
    force_ipv4: bool = False,
    output_template: Optional[str] = None,
):
    """Celery worker task to process a media download job."""
    logger.info(f"[Celery Worker] Starting download task for job: {download_job_id}")
    try:
        execute_download(
            download_job_id=download_job_id,
            url=url,
            format_type=format_type,
            quality=quality,
            audio_codec=audio_codec,
            audio_bitrate=audio_bitrate,
            extract_subtitles=extract_subtitles,
            subtitle_lang=subtitle_lang,
            sponsorblock_remove=sponsorblock_remove,
            custom_flags=custom_flags,
            remux_mkv=remux_mkv,
            crop_artwork=crop_artwork,
            embed_subtitles=embed_subtitles,
            cookies_str=cookies_str,
            proxy_url=proxy_url,
            start_time=start_time,
            end_time=end_time,
            max_filesize=max_filesize,
            rate_limit=rate_limit,
            restrict_filenames=restrict_filenames,
            force_ipv4=force_ipv4,
            output_template=output_template,
        )
    except Exception as e:
        logger.error(f"[Celery Worker] Error executing download job {download_job_id}: {e}")

def run_download_job(
    download_job_id: str,
    url: str,
    format_type: str,
    quality: str,
    audio_codec: Optional[str] = None,
    audio_bitrate: Optional[str] = None,
    extract_subtitles: bool = False,
    subtitle_lang: Optional[str] = "en",
    sponsorblock_remove: bool = False,
    custom_flags: Optional[List[str]] = None,
    remux_mkv: bool = False,
    crop_artwork: bool = True,
    embed_subtitles: bool = False,
    cookies_str: Optional[str] = None,
    proxy_url: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    max_filesize: Optional[str] = None,
    rate_limit: Optional[str] = None,
    restrict_filenames: bool = False,
    force_ipv4: bool = False,
    output_template: Optional[str] = None,
):
    """Local fallback runner (FastAPI BackgroundTasks or thread pool execution)."""
    logger.info(f"[Local BackgroundTask] Starting download task for job: {download_job_id}")
    try:
        execute_download(
            download_job_id=download_job_id,
            url=url,
            format_type=format_type,
            quality=quality,
            audio_codec=audio_codec,
            audio_bitrate=audio_bitrate,
            extract_subtitles=extract_subtitles,
            subtitle_lang=subtitle_lang,
            sponsorblock_remove=sponsorblock_remove,
            custom_flags=custom_flags,
            remux_mkv=remux_mkv,
            crop_artwork=crop_artwork,
            embed_subtitles=embed_subtitles,
            cookies_str=cookies_str,
            proxy_url=proxy_url,
            start_time=start_time,
            end_time=end_time,
            max_filesize=max_filesize,
            rate_limit=rate_limit,
            restrict_filenames=restrict_filenames,
            force_ipv4=force_ipv4,
            output_template=output_template,
        )
    except Exception as e:
        logger.error(f"[Local BackgroundTask] Error executing download job {download_job_id}: {e}")

def dispatch_download_job(
    background_tasks: BackgroundTasks,
    download_job_id: str,
    url: str,
    format_type: str,
    quality: str,
    audio_codec: Optional[str] = None,
    audio_bitrate: Optional[str] = None,
    extract_subtitles: bool = False,
    subtitle_lang: Optional[str] = "en",
    sponsorblock_remove: bool = False,
    custom_flags: Optional[List[str]] = None,
    remux_mkv: bool = False,
    crop_artwork: bool = True,
    embed_subtitles: bool = False,
    cookies_str: Optional[str] = None,
    proxy_url: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    max_filesize: Optional[str] = None,
    rate_limit: Optional[str] = None,
    restrict_filenames: bool = False,
    force_ipv4: bool = False,
    output_template: Optional[str] = None,
):
    """
    Dispatches download job:
    Uses Celery if Redis/Celery worker is available and configured;
    otherwise falls back to FastAPI BackgroundTasks for local standalone dev.
    """
    if is_celery_available():
        logger.info(f"Dispatching download job {download_job_id} via Celery.")
        download_media_task.delay(
            download_job_id,
            url,
            format_type,
            quality,
            audio_codec,
            audio_bitrate,
            extract_subtitles,
            subtitle_lang,
            sponsorblock_remove,
            custom_flags,
            remux_mkv,
            crop_artwork,
            embed_subtitles,
            cookies_str,
            proxy_url,
            start_time,
            end_time,
            max_filesize,
            rate_limit,
            restrict_filenames,
            force_ipv4,
            output_template,
        )
    else:
        logger.info(f"Dispatching download job {download_job_id} via FastAPI BackgroundTasks.")
        background_tasks.add_task(
            run_download_job,
            download_job_id,
            url,
            format_type,
            quality,
            audio_codec,
            audio_bitrate,
            extract_subtitles,
            subtitle_lang,
            sponsorblock_remove,
            custom_flags,
            remux_mkv,
            crop_artwork,
            embed_subtitles,
            cookies_str,
            proxy_url,
            start_time,
            end_time,
            max_filesize,
            rate_limit,
            restrict_filenames,
            force_ipv4,
            output_template,
        )

