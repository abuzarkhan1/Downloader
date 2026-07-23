export interface VideoFormat {
  quality: string;
  ext: string;
  filesize_mb: number;
  fps: number;
}

export interface AudioFormat {
  quality: string;
  ext: string;
  filesize_mb: number;
}

export interface AnalyzeResponse {
  id: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | string;
  title: string;
  thumbnail: string;
  duration_seconds: number;
  uploader: string;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
}

export interface DownloadRequestPayload {
  id: string;
  format_type: 'video' | 'audio';
  quality: string;
  url?: string;
}

export interface DownloadResponse {
  download_job_id: string;
  status: 'queued' | 'processing' | 'ready' | 'failed' | string;
}

export interface DownloadStatusResponse {
  status: 'queued' | 'processing' | 'ready' | 'failed' | string;
  progress_percent: number;
  file_url?: string | null;
  error?: string | null;
}

export type ErrorCode =
  | 'UNSUPPORTED_URL'
  | 'PRIVATE_CONTENT'
  | 'RATE_LIMITED'
  | 'PLATFORM_BLOCKED'
  | 'NETWORK_ERROR'
  | string;

export class ApiError extends Error {
  error_code: ErrorCode;

  constructor(error_code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.error_code = error_code;
  }
}

/**
 * Translates error codes into human-readable error messages.
 */
export function formatErrorMessage(errorCode: ErrorCode | string): string {
  switch (errorCode) {
    case 'UNSUPPORTED_URL':
      return 'The provided URL is not supported. Supported platforms are YouTube, TikTok, Instagram, Facebook, and X (Twitter).';
    case 'PRIVATE_CONTENT':
      return 'This content is private or restricted and cannot be downloaded.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment before trying again.';
    case 'PLATFORM_BLOCKED':
      return 'Access to this platform is temporarily blocked or restricted by the target site.';
    case 'NETWORK_ERROR':
      return 'Unable to connect to backend server. Using fallback mock mode.';
    default:
      return typeof errorCode === 'string' && errorCode.trim().length > 0
        ? errorCode
        : 'An unknown error occurred. Please try again.';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export let USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function setUseMock(value: boolean) {
  USE_MOCK = value;
}

// Mock state store for download jobs
const mockJobStore = new Map<
  string,
  {
    createdAt: number;
    format_type: 'video' | 'audio';
    quality: string;
  }
>();

/**
 * Analyzes media URL by calling POST /api/v1/analyze.
 * Falls back to mock mode if backend is unreachable or USE_MOCK is true.
 */
export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  if (USE_MOCK) {
    return getMockAnalyzeResponse(url);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      let errData: { error_code?: string; detail?: string | { error_code?: string; message?: string }; message?: string } = {};
      try {
        errData = await res.json();
      } catch {
        // failed to parse JSON error
      }

      let code: ErrorCode = 'UNKNOWN_ERROR';
      let msg = 'Failed to analyze URL';

      if (typeof errData.detail === 'object' && errData.detail !== null) {
        code = errData.detail.error_code || code;
        msg = errData.detail.message || msg;
      } else if (typeof errData.detail === 'string') {
        msg = errData.detail;
      } else if (errData.error_code) {
        code = errData.error_code;
        msg = errData.message || msg;
      }

      if (res.status === 400 && code === 'UNKNOWN_ERROR') code = 'UNSUPPORTED_URL';
      if (res.status === 403) code = 'PRIVATE_CONTENT';
      if (res.status === 429) code = 'RATE_LIMITED';
      if (res.status === 422) code = 'PLATFORM_BLOCKED';

      throw new ApiError(code, formatErrorMessage(code) || msg);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    console.warn('Backend unreachable for analyzeUrl, falling back to mock mode:', err);
    return getMockAnalyzeResponse(url);
  }
}

/**
 * Starts a download job by calling POST /api/v1/download.
 * Falls back to mock mode if backend is unreachable or USE_MOCK is true.
 */
export async function startDownload(
  id: string,
  format_type: 'video' | 'audio',
  quality: string
): Promise<DownloadResponse> {
  if (USE_MOCK) {
    return getMockStartDownloadResponse(id, format_type, quality);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, format_type, quality }),
    });

    if (!res.ok) {
      let errData: { detail?: string | { error_code?: string; message?: string } } = {};
      try {
        errData = await res.json();
      } catch {
        // ignore
      }

      let code: ErrorCode = 'DOWNLOAD_FAILED';
      let msg = 'Failed to start download';

      if (typeof errData.detail === 'object' && errData.detail !== null) {
        code = errData.detail.error_code || code;
        msg = errData.detail.message || msg;
      } else if (typeof errData.detail === 'string') {
        msg = errData.detail;
      }

      throw new ApiError(code, formatErrorMessage(code) || msg);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    console.warn('Backend unreachable for startDownload, falling back to mock mode:', err);
    return getMockStartDownloadResponse(id, format_type, quality);
  }
}

/**
 * Retrieves status of a download job by calling GET /api/v1/download/{downloadJobId}/status.
 * Falls back to mock mode if backend is unreachable or USE_MOCK is true.
 */
export async function getDownloadStatus(downloadJobId: string): Promise<DownloadStatusResponse> {
  if (USE_MOCK) {
    return getMockDownloadStatusResponse(downloadJobId);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/download/${encodeURIComponent(downloadJobId)}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      let errData: { detail?: string } = {};
      try {
        errData = await res.json();
      } catch {
        // ignore
      }

      const msg = errData.detail || 'Download status not found';
      throw new ApiError('JOB_NOT_FOUND', msg);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    console.warn('Backend unreachable for getDownloadStatus, falling back to mock mode:', err);
    return getMockDownloadStatusResponse(downloadJobId);
  }
}

// --- Helper Functions for Mock Mode ---

function detectPlatformFromUrl(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return 'facebook';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  return 'youtube';
}

function getMockAnalyzeResponse(url: string): AnalyzeResponse {
  const platform = detectPlatformFromUrl(url);

  let title = `Sample ${platform.toUpperCase()} Video - High Quality Media`;
  if (platform === 'twitter') {
    title = 'Sample X (Twitter) Post Video - High Quality Media';
  }

  return {
    id: `job_mock_${Math.random().toString(36).substring(2, 9)}`,
    platform,
    title,
    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80',
    duration_seconds: 184,
    uploader: 'Sample Creator',
    video_formats: [
      { quality: '1080p', ext: 'mp4', filesize_mb: 45.2, fps: 60 },
      { quality: '720p', ext: 'mp4', filesize_mb: 22.8, fps: 30 },
      { quality: '480p', ext: 'mp4', filesize_mb: 12.4, fps: 30 },
    ],
    audio_formats: [
      { quality: '320kbps', ext: 'mp3', filesize_mb: 5.6 },
      { quality: '192kbps', ext: 'mp3', filesize_mb: 3.4 },
      { quality: '128kbps', ext: 'mp3', filesize_mb: 2.1 },
    ],
  };
}

function getMockStartDownloadResponse(
  id: string,
  format_type: 'video' | 'audio',
  quality: string
): DownloadResponse {
  const download_job_id = `dl_mock_${Math.random().toString(36).substring(2, 10)}`;
  mockJobStore.set(download_job_id, {
    createdAt: Date.now(),
    format_type,
    quality,
  });
  return {
    download_job_id,
    status: 'queued',
  };
}

function getMockDownloadStatusResponse(downloadJobId: string): DownloadStatusResponse {
  const job = mockJobStore.get(downloadJobId);
  if (!job) {
    mockJobStore.set(downloadJobId, {
      createdAt: Date.now(),
      format_type: 'video',
      quality: '1080p',
    });
    return {
      status: 'processing',
      progress_percent: 15.0,
      file_url: null,
      error: null,
    };
  }

  const elapsedMs = Date.now() - job.createdAt;
  const totalDurationMs = 3000;

  if (elapsedMs >= totalDurationMs) {
    return {
      status: 'ready',
      progress_percent: 100.0,
      file_url: `${API_BASE_URL}/api/v1/files/${downloadJobId}`,
      error: null,
    };
  }

  const progress = Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100));
  return {
    status: 'processing',
    progress_percent: progress,
    file_url: null,
    error: null,
  };
}

const apiClient = {
  analyzeUrl,
  startDownload,
  getDownloadStatus,
  formatErrorMessage,
  USE_MOCK,
  setUseMock,
};

export default apiClient;
