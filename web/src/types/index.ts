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

export interface MediaMetadata {
  id: string;
  title: string;
  uploader: string;
  uploaderUrl?: string;
  thumbnailUrl: string;
  duration: string;
  platform?: "youtube" | "tiktok" | "instagram" | "facebook" | "other";
  formats: FormatOption[];
}

export interface HomeScreenProps {
  analyzeUrl: (url: string) => void;
  onAnalyzeUrl?: (url: string) => void;
  initialUrl?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
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

