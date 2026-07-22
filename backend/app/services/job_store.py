import time
from typing import Dict, Optional, Literal
from app.services.cache import get_job as get_cached_analyze_job

class JobStore:
    """
    In-memory / thread-safe Job Status Store.
    Tracks status ("queued" | "processing" | "ready" | "failed"), progress (0..100),
    file_path, and error messages for download jobs.
    Also acts as a registry for analyze jobs if needed.
    """
    def __init__(self):
        self._jobs: Dict[str, dict] = {}
        self._analyze_jobs: Dict[str, str] = {}  # analyze_id -> url

    def register_analyze_job(self, analyze_id: str, url: str):
        self._analyze_jobs[analyze_id] = url

    def get_url_for_analyze_job(self, analyze_id: str) -> Optional[str]:
        if analyze_id in self._analyze_jobs:
            return self._analyze_jobs[analyze_id]
        cached = get_cached_analyze_job(analyze_id)
        if cached and isinstance(cached, dict) and "url" in cached:
            return cached["url"]
        return None

    def create_download_job(self, download_job_id: str, analyze_id: str, format_type: str, quality: str, url: Optional[str] = None):
        target_url = url or self.get_url_for_analyze_job(analyze_id) or analyze_id
        self._jobs[download_job_id] = {
            "download_job_id": download_job_id,
            "analyze_id": analyze_id,
            "url": target_url,
            "format_type": format_type,
            "quality": quality,
            "status": "queued",
            "progress_percent": 0.0,
            "file_url": None,
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time(),
        }

    def update_job_progress(self, download_job_id: str, progress_percent: float, status: Optional[str] = None):
        if download_job_id in self._jobs:
            self._jobs[download_job_id]["progress_percent"] = round(float(progress_percent), 2)
            if status:
                self._jobs[download_job_id]["status"] = status
            elif self._jobs[download_job_id]["status"] == "queued" and progress_percent > 0:
                self._jobs[download_job_id]["status"] = "processing"
            self._jobs[download_job_id]["updated_at"] = time.time()

    def set_job_ready(self, download_job_id: str, file_url: str):
        if download_job_id in self._jobs:
            self._jobs[download_job_id]["status"] = "ready"
            self._jobs[download_job_id]["progress_percent"] = 100.0
            self._jobs[download_job_id]["file_url"] = file_url
            self._jobs[download_job_id]["updated_at"] = time.time()

    def set_job_failed(self, download_job_id: str, error_message: str):
        if download_job_id in self._jobs:
            self._jobs[download_job_id]["status"] = "failed"
            self._jobs[download_job_id]["error"] = error_message
            self._jobs[download_job_id]["updated_at"] = time.time()

    def get_job(self, download_job_id: str) -> Optional[dict]:
        return self._jobs.get(download_job_id)

job_store = JobStore()
