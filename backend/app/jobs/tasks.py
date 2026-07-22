import logging
from fastapi import BackgroundTasks
from app.jobs.celery_app import celery_app, is_celery_available
from app.services.downloader import execute_download

logger = logging.getLogger(__name__)

@celery_app.task(name="app.jobs.tasks.download_media_task")
def download_media_task(download_job_id: str, url: str, format_type: str, quality: str):
    """Celery worker task to process a media download job."""
    logger.info(f"[Celery Worker] Starting download task for job: {download_job_id}")
    try:
        execute_download(download_job_id, url, format_type, quality)
    except Exception as e:
        logger.error(f"[Celery Worker] Error executing download job {download_job_id}: {e}")

def run_download_job(download_job_id: str, url: str, format_type: str, quality: str):
    """Local fallback runner (FastAPI BackgroundTasks or thread pool execution)."""
    logger.info(f"[Local BackgroundTask] Starting download task for job: {download_job_id}")
    try:
        execute_download(download_job_id, url, format_type, quality)
    except Exception as e:
        logger.error(f"[Local BackgroundTask] Error executing download job {download_job_id}: {e}")

def dispatch_download_job(
    background_tasks: BackgroundTasks,
    download_job_id: str,
    url: str,
    format_type: str,
    quality: str
):
    """
    Dispatches download job:
    Uses Celery if Redis/Celery worker is available and configured;
    otherwise falls back to FastAPI BackgroundTasks for local standalone dev.
    """
    if is_celery_available():
        logger.info(f"Dispatching download job {download_job_id} via Celery.")
        download_media_task.delay(download_job_id, url, format_type, quality)
    else:
        logger.info(f"Dispatching download job {download_job_id} via FastAPI BackgroundTasks.")
        background_tasks.add_task(run_download_job, download_job_id, url, format_type, quality)
