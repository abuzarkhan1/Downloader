import logging
from celery import Celery
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Celery app instance
celery_app = Celery(
    "video_downloader_jobs",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

def is_celery_available() -> bool:
    """Check if Celery/Redis is explicitly enabled and reachable."""
    if not settings.USE_CELERY:
        return False
    try:
        # Check connection to broker
        conn = celery_app.connection_for_read()
        conn.connect()
        conn.close()
        return True
    except Exception as e:
        logger.warning(f"Celery/Redis broker is not reachable ({e}). Falling back to local BackgroundTasks.")
        return False
