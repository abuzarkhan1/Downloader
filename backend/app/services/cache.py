import os
import json
import threading
from typing import Optional, Dict, Any

_LOCK = threading.Lock()
JOBS_CACHE: Dict[str, Any] = {}

# File persistent store path for cross-process compatibility if needed by Agent B
CACHE_FILE_PATH = os.environ.get("JOBS_CACHE_FILE", "/tmp/video_downloader_jobs.json")


def _sync_to_file():
    try:
        tmp_path = CACHE_FILE_PATH + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(JOBS_CACHE, f, indent=2)
        os.replace(tmp_path, CACHE_FILE_PATH)
    except Exception:
        pass


def _sync_from_file():
    global JOBS_CACHE
    if os.path.exists(CACHE_FILE_PATH):
        try:
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    JOBS_CACHE.update(data)
        except Exception:
            pass


# Initial load from disk if file exists
_sync_from_file()


def save_job(job_id: str, data: Dict[str, Any]) -> None:
    """Saves job metadata to shared in-memory dictionary and persistent JSON file."""
    with _LOCK:
        JOBS_CACHE[job_id] = data
        _sync_to_file()


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves job metadata from cache."""
    with _LOCK:
        if job_id in JOBS_CACHE:
            return JOBS_CACHE[job_id]
        # Fallback to reading disk in case written by another worker/subagent
        _sync_from_file()
        return JOBS_CACHE.get(job_id)


def delete_job(job_id: str) -> bool:
    """Removes job from cache."""
    with _LOCK:
        if job_id in JOBS_CACHE:
            del JOBS_CACHE[job_id]
            _sync_to_file()
            return True
        return False


def list_jobs() -> Dict[str, Any]:
    """Returns copy of all cached jobs."""
    with _LOCK:
        _sync_from_file()
        return dict(JOBS_CACHE)
