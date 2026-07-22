from typing import Optional, Literal
from pydantic import BaseModel, Field

class DownloadRequest(BaseModel):
    id: str = Field(..., description="Analyze job ID (e.g. job_abc123) or URL")
    format_type: Literal["video", "audio"] = Field(..., description="Format type: 'video' or 'audio'")
    quality: str = Field("best", description="Quality selection, e.g. '1080p', '720p', '192kbps'")
    url: Optional[str] = Field(None, description="Optional direct URL override if id is not registered in analyze store")

class DownloadResponse(BaseModel):
    download_job_id: str
    status: str = "queued"

class DownloadStatusResponse(BaseModel):
    status: Literal["queued", "processing", "ready", "failed"]
    progress_percent: float = 0.0
    file_url: Optional[str] = None
    error: Optional[str] = None
