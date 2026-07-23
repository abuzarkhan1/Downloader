export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'unknown';

export interface VideoFormat {
  quality: string;
  ext: string;
  filesize_mb: number;
  fps?: number;
}

export interface AudioFormat {
  quality: string;
  ext: string;
  filesize_mb: number;
}

export interface AnalyzeResponse {
  id: string;
  platform: Platform;
  title: string;
  thumbnail: string;
  duration_seconds: number;
  uploader: string;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
}

export type ErrorCode = 
  | 'UNSUPPORTED_URL' 
  | 'PRIVATE_CONTENT' 
  | 'RATE_LIMITED' 
  | 'PLATFORM_BLOCKED' 
  | 'NETWORK_ERROR' 
  | 'UNKNOWN';

export interface AnalyzeErrorResponse {
  error_code: ErrorCode;
  message: string;
}

export interface DownloadRequest {
  id: string;
  format_type: 'video' | 'audio';
  quality: string;
}

export interface DownloadJobResponse {
  download_job_id: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
}

export interface DownloadStatusResponse {
  status: 'queued' | 'processing' | 'ready' | 'failed';
  progress_percent: number;
  file_url?: string;
  error_message?: string;
  error?: string;
  local_uri?: string;
}

export type ScreenName = 'Home' | 'Loading' | 'Results' | 'Download';
