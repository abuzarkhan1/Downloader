from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class DownloadRequest(BaseModel):
    id: str = Field(..., description="Analyze job ID (e.g. job_abc123) or URL")
    format_type: Literal["video", "audio"] = Field(..., description="Format type: 'video' or 'audio'")
    quality: str = Field("best", description="Quality selection, e.g. '1080p', '720p', '192kbps'")
    url: Optional[str] = Field(None, description="Optional direct URL override if id is not registered in analyze store")
    audio_codec: Optional[Literal["mp3", "m4a", "flac", "opus"]] = Field(None, description="Audio codec selection")
    audio_bitrate: Optional[Literal["128k", "192k", "320k"]] = Field(None, description="Audio bitrate selection")
    extract_subtitles: Optional[bool] = Field(False, description="Extract subtitles")
    subtitle_lang: Optional[str] = Field("en", description="Subtitle language code")
    sponsorblock_remove: Optional[bool] = Field(False, description="Remove SponsorBlock segments")
    custom_flags: Optional[List[str]] = Field(default_factory=list, description="Safe custom yt-dlp flag templates")

DownloadRequestPayload = DownloadRequest

class DownloadResponse(BaseModel):
    download_job_id: str
    status: str = "queued"

class DownloadStatusResponse(BaseModel):
    status: Literal["queued", "processing", "ready", "failed"]
    progress_percent: float = 0.0
    file_url: Optional[str] = None
    error: Optional[str] = None
