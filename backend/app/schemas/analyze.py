from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="Target media URL to analyze")
    remove_watermark: bool = Field(True, description="Default watermark removal setting for TikTok/Shorts")


class VideoFormat(BaseModel):
    quality: str = Field(..., description="Resolution quality (e.g., 1080p, 720p)")
    ext: str = Field("mp4", description="File extension")
    filesize_mb: float = Field(..., description="Estimated or actual file size in MB")
    fps: int = Field(30, description="Frames per second")


class AudioFormat(BaseModel):
    quality: str = Field("192kbps", description="Audio quality / bitrate (e.g., 128kbps, 192kbps, 320kbps, lossless)")
    ext: str = Field("mp3", description="Audio file extension ('mp3', 'm4a', 'wav')")
    filesize_mb: float = Field(..., description="Estimated or actual file size in MB")


class SubtitleOption(BaseModel):
    lang: str = Field(..., description="Language code, e.g., en, es")
    name: str = Field(..., description="Human-readable language name")
    is_auto: bool = Field(False, description="True if automatically generated caption")


class AnalyzeResponse(BaseModel):
    id: str = Field(..., description="Job identifier")
    platform: str = Field(..., description="Detected platform (youtube|tiktok|instagram|facebook|twitter|vimeo|reddit|web)")
    title: str = Field(..., description="Content title")
    thumbnail: str = Field(..., description="Thumbnail image URL")
    duration_seconds: int = Field(..., description="Duration in seconds")
    uploader: str = Field(..., description="Uploader / Channel name")
    video_formats: List[VideoFormat] = Field(default_factory=list)
    audio_formats: List[AudioFormat] = Field(default_factory=list)
    subtitles: List[SubtitleOption] = Field(default_factory=list)


class BatchAnalyzeRequest(BaseModel):
    urls: Optional[List[str]] = Field(None, description="List of media URLs to analyze")
    url: Optional[str] = Field(None, description="Playlist URL or multi-line URLs string")
    remove_watermark: bool = Field(True, description="Default watermark removal setting")


class BatchAnalyzeResponse(BaseModel):
    playlist_title: Optional[str] = Field(None, description="Playlist title if analyzing a playlist")
    total_items: int = Field(..., description="Total items analyzed")
    items: List[AnalyzeResponse] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error_code: str = Field(..., description="Error classification code")
    message: str = Field(..., description="Human readable error message")

