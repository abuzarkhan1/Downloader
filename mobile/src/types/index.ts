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
  remuxMkv?: boolean;
  cropArtwork?: boolean;
  embedSubtitles?: boolean;
  cookiesStr?: string;
  proxyUrl?: string;
  subtitleLang?: string;
  startTime?: string;
  endTime?: string;
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

export type ScreenName = 'Home' | 'Loading' | 'Results' | 'Download' | 'History' | 'Templates' | 'Settings';

export type AudioCodec = 'MP3' | 'M4A' | 'FLAC' | 'OPUS';
export type AudioBitrate = '128k' | '192k' | '320k';
export type DarkModeVariant = 'dark' | 'dim' | 'oled';

export type DownloadHistoryStatus = 'completed' | 'processing' | 'failed';

export interface DownloadHistoryItem {
  id: string;
  title: string;
  url?: string;
  platform?: Platform;
  uploader?: string;
  thumbnail?: string;
  filePath?: string;
  format: 'video' | 'audio';
  quality: string;
  status: DownloadHistoryStatus;
  timestamp: string;
  filesize_mb?: number;
  duration_seconds?: number;
  errorMessage?: string;
}

export interface UserSettings {
  defaultQuality: string;
  audioCodec: AudioCodec;
  audioBitrate: AudioBitrate;
  sponsorBlock: boolean;
  subtitles: boolean;
  darkMode: DarkModeVariant;
  autoDownloadClipboard: boolean;
  downloadDirectory: string;
  remuxMkv?: boolean;
  cropArtwork?: boolean;
  embedSubtitles?: boolean;
  cookiesStr?: string;
  proxyUrl?: string;
  subtitleLang?: string;
  startTime?: string;
  endTime?: string;
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  flags: string;
  isCustom?: boolean;
}

