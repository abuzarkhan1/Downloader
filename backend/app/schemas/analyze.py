from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="Target media URL to analyze")


class VideoFormat(BaseModel):
    quality: str = Field(..., description="Resolution quality (e.g., 1080p, 720p)")
    ext: str = Field("mp4", description="File extension")
    filesize_mb: float = Field(..., description="Estimated or actual file size in MB")
    fps: int = Field(30, description="Frames per second")


class AudioFormat(BaseModel):
    quality: str = Field("192kbps", description="Audio quality / bitrate")
    ext: str = Field("mp3", description="Audio file extension")
    filesize_mb: float = Field(..., description="Estimated or actual file size in MB")


class AnalyzeResponse(BaseModel):
    id: str = Field(..., description="Job identifier")
    platform: str = Field(..., description="Detected platform (youtube|tiktok|instagram)")
    title: str = Field(..., description="Content title")
    thumbnail: str = Field(..., description="Thumbnail image URL")
    duration_seconds: int = Field(..., description="Duration in seconds")
    uploader: str = Field(..., description="Uploader / Channel name")
    video_formats: List[VideoFormat] = Field(default_factory=list)
    audio_formats: List[AudioFormat] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error_code: str = Field(..., description="Error classification code")
    message: str = Field(..., description="Human readable error message")
