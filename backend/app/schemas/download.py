from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class DownloadRequest(BaseModel):
    id: str = Field(..., description="Analyze job ID (e.g. job_abc123) or URL")
    format_type: Literal["video", "audio", "subtitle"] = Field(..., description="Format type: 'video', 'audio', or 'subtitle'")
    quality: str = Field("best", description="Quality selection, e.g. '1080p', '720p', '192kbps'")
    audio_ext: Optional[str] = Field(None, description="Audio extension: 'mp3', 'm4a', or 'wav'")
    ext: Optional[str] = Field(None, description="Format extension override for audio/subtitle")
    subtitle_lang: Optional[str] = Field("en", description="Subtitle language code (e.g. 'en', 'es')")
    subtitle_ext: Optional[str] = Field("srt", description="Subtitle format extension: 'srt', 'vtt', or 'txt'")
    remove_watermark: bool = Field(True, description="Remove watermark for TikTok/Shorts")
    url: Optional[str] = Field(None, description="Optional direct URL override if id is not registered in analyze store")

class DownloadResponse(BaseModel):
    download_job_id: str
    status: str = "queued"

class BatchDownloadRequest(BaseModel):
    items: List[DownloadRequest] = Field(..., description="List of download requests")

class BatchDownloadResponse(BaseModel):
    download_jobs: List[DownloadResponse] = Field(default_factory=list)

class DownloadStatusResponse(BaseModel):
    status: Literal["queued", "processing", "ready", "failed"]
    progress_percent: float = 0.0
    file_url: Optional[str] = None
    error: Optional[str] = None

