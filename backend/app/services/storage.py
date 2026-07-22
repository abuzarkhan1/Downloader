import os
import time
import shutil
import logging
from typing import Optional, Dict
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)

class TemporaryStorageManager:
    """
    Temporary Storage Manager:
    - Handles temporary media file saving and retrieval.
    - Enforces TTL (default 1 hour / 3600 seconds) auto-deletion.
    - Enforces post-download cleanup.
    - Guarantees NO permanent media storage.
    """
    def __init__(self, temp_dir: str = settings.TEMP_DIR, ttl_seconds: int = settings.FILE_TTL_SECONDS):
        self.temp_dir = Path(temp_dir)
        self.ttl_seconds = ttl_seconds
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        # Store metadata mapping download_job_id -> { "file_path": str, "created_at": float }
        self._registry: Dict[str, dict] = {}

    def get_job_dir(self, download_job_id: str) -> Path:
        """Get job-specific subfolder inside temporary directory."""
        job_dir = self.temp_dir / download_job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    def register_file(self, download_job_id: str, file_path: str) -> None:
        """Register a generated file for a download job."""
        self._registry[download_job_id] = {
            "file_path": str(file_path),
            "created_at": time.time()
        }

    def get_file_path(self, download_job_id: str) -> Optional[Path]:
        """Retrieve file path if it exists and has not expired."""
        info = self._registry.get(download_job_id)
        if info:
            file_path = Path(info["file_path"])
            if file_path.exists():
                # Check if expired
                if time.time() - info["created_at"] > self.ttl_seconds:
                    logger.info(f"File for job {download_job_id} has expired (TTL {self.ttl_seconds}s). Deleting.")
                    self.delete_job_file(download_job_id)
                    return None
                return file_path
        
        # Fallback check on filesystem if registry key missing
        job_dir = self.temp_dir / download_job_id
        if job_dir.exists():
            files = list(job_dir.glob("*"))
            if files:
                first_file = files[0]
                # Check file modification time for TTL
                if time.time() - first_file.stat().st_mtime > self.ttl_seconds:
                    logger.info(f"File for job {download_job_id} on disk expired. Deleting.")
                    self.delete_job_file(download_job_id)
                    return None
                return first_file
        return None

    def delete_job_file(self, download_job_id: str) -> bool:
        """Delete temporary directory and files associated with download_job_id."""
        info = self._registry.pop(download_job_id, None)
        deleted = False
        
        if info and os.path.exists(info["file_path"]):
            try:
                os.remove(info["file_path"])
                deleted = True
            except Exception as e:
                logger.error(f"Error removing file {info['file_path']}: {e}")
        
        job_dir = self.temp_dir / download_job_id
        if job_dir.exists():
            try:
                shutil.rmtree(job_dir, ignore_errors=True)
                deleted = True
            except Exception as e:
                logger.error(f"Error removing job dir {job_dir}: {e}")

        return deleted

    def cleanup_expired_files(self) -> int:
        """Scan temp storage and delete any files older than TTL."""
        count = 0
        now = time.time()
        
        # Cleanup registered entries
        expired_jobs = [
            job_id for job_id, info in self._registry.items()
            if now - info.get("created_at", 0) > self.ttl_seconds
        ]
        for job_id in expired_jobs:
            if self.delete_job_file(job_id):
                count += 1

        # Scan filesystem for orphan directories
        if self.temp_dir.exists():
            for item in self.temp_dir.iterdir():
                if item.is_dir():
                    try:
                        # Check mtime of dir or its files
                        mtime = item.stat().st_mtime
                        if now - mtime > self.ttl_seconds:
                            shutil.rmtree(item, ignore_errors=True)
                            count += 1
                    except Exception as e:
                        logger.error(f"Error cleaning orphan dir {item}: {e}")
        return count

storage_manager = TemporaryStorageManager()
