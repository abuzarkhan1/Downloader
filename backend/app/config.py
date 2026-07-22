import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Video Downloader API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Redis / Celery configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    USE_CELERY: bool = os.getenv("USE_CELERY", "false").lower() in ("true", "1", "yes")
    
    # Storage settings
    TEMP_DIR: str = os.getenv("TEMP_DIR", "/tmp/video_downloader_temp")
    FILE_TTL_SECONDS: int = int(os.getenv("FILE_TTL_SECONDS", "3600"))  # 1 hour auto-deletion
    
    # Base URL for building file URLs
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")

    # FFmpeg configuration
    FFMPEG_LOCATION: str = os.getenv("FFMPEG_LOCATION", "")

settings = Settings()

