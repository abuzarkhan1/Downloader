export interface FormatOption {
  id: string;
  quality: string;
  extension: string;
  filesize: string;
  url?: string;
  isAudio?: boolean;
  resolution?: string;
  fps?: number;
  hasAudio?: boolean;
  bitrate?: string;
}

export type Platform = "youtube" | "tiktok" | "instagram" | "facebook" | "twitter" | "other";

export interface SubtitleOption {
  language: string;
  code: string;
  label: string;
  formats: ("srt" | "vtt" | "txt")[];
}

export interface MediaMetadata {
  id: string;
  title: string;
  uploader: string;
  uploaderUrl?: string;
  thumbnailUrl: string;
  duration: string;
  platform?: Platform;
  formats: FormatOption[];
  subtitles?: SubtitleOption[];
}

export interface BatchItem {
  id: string;
  url: string;
  status: "pending" | "analyzing" | "ready" | "failed" | "downloading" | "completed";
  media?: MediaMetadata;
  selectedFormat?: FormatOption;
  downloadJobId?: string;
  progressPercent?: number;
  error?: string;
}

export type AudioFormatType = "MP3" | "M4A" | "WAV";
export type AudioBitrate = "128 kbps" | "192 kbps" | "320 kbps";

export interface HomeScreenProps {
  analyzeUrl: (url: string) => void;
  onAnalyzeUrl?: (url: string) => void;
  initialUrl?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  removeWatermark?: boolean;
  onToggleWatermark?: (value: boolean) => void;
  onBatchAnalyze?: (urls: string[]) => void;
}

export interface LoadingScreenProps {
  statusMessage?: string;
  url?: string;
  onCancel?: () => void;
}

export interface ResultsScreenProps {
  media: MediaMetadata;
  onDownload?: (format: FormatOption) => void;
  onReset?: () => void;
  analyzeUrl?: (url: string) => void;
  removeWatermark?: boolean;
  onToggleWatermark?: (value: boolean) => void;
}

export interface DownloadScreenProps {
  downloadJobId: string;
  media?: MediaMetadata | null;
  selectedFormat?: FormatOption | null;
  onBack?: () => void;
  onReset?: () => void;
  onBackToSearch?: () => void;
  onComplete?: (fileUrl: string) => void;
}
