import { Platform as RNPlatform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {
  AnalyzeResponse,
  AnalyzeErrorResponse,
  DownloadJobResponse,
  DownloadStatusResponse,
  Platform,
  ErrorCode,
} from '../types';

export let USE_MOCK = false;

export function setUseMock(mock: boolean) {
  USE_MOCK = mock;
}

export let API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (RNPlatform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

/**
 * Section 6.1 Error message formatting
 */
export function formatErrorMessage(errorCode?: ErrorCode | string, message?: string): string {
  switch (errorCode) {
    case 'UNSUPPORTED_URL':
      return "This link isn't supported yet.";
    case 'PRIVATE_CONTENT':
      return "This content requires login and can't be processed.";
    case 'RATE_LIMITED':
      return 'Rate limit exceeded. Try again in a few minutes.';
    case 'PLATFORM_BLOCKED':
      return 'Platform blocked request. Try again later.';
    case 'NETWORK_ERROR':
      return 'No internet connection.';
    default:
      return message || 'An unexpected error occurred.';
  }
}

/**
 * Detect platform from URL pattern
 */
export function detectPlatform(url: string): Platform {
  const lower = url.toLowerCase().trim();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok')) {
    return 'tiktok';
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return 'instagram';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return 'facebook';
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return 'twitter';
  }
  return 'unknown';
}

// In-memory mock download progress store
const activeMockDownloads: Map<
  string,
  { progress: number; status: 'queued' | 'processing' | 'ready' | 'failed'; cancelled: boolean }
> = new Map();

/**
 * Analyze URL contract: POST /api/v1/analyze
 */
export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const trimmed = url.trim();

  if (!trimmed || !trimmed.startsWith('http')) {
    const errorCode: ErrorCode = 'UNSUPPORTED_URL';
    const error: AnalyzeErrorResponse = {
      error_code: errorCode,
      message: formatErrorMessage(errorCode),
    };
    throw error;
  }

  if (USE_MOCK) {
    if (trimmed.includes('private')) {
      const errorCode: ErrorCode = 'PRIVATE_CONTENT';
      throw { error_code: errorCode, message: formatErrorMessage(errorCode) };
    }

    if (trimmed.includes('ratelimit')) {
      const errorCode: ErrorCode = 'RATE_LIMITED';
      throw { error_code: errorCode, message: formatErrorMessage(errorCode) };
    }

    if (trimmed.includes('blocked')) {
      const errorCode: ErrorCode = 'PLATFORM_BLOCKED';
      throw { error_code: errorCode, message: formatErrorMessage(errorCode) };
    }

    // Simulate network delay for realistic analyzing state in mock mode
    await new Promise((resolve) => setTimeout(resolve, 500));

    const platform = detectPlatform(trimmed);

    if (platform === 'youtube') {
      return {
        id: `job_yt_${Date.now()}`,
        platform: 'youtube',
        title: 'Amazing 4K Nature & Wildlife Cinematic Relaxation Video',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        duration_seconds: 245,
        uploader: 'Nature Expeditions HD',
        video_formats: [
          { quality: '2160p', ext: 'mp4', filesize_mb: 340.5, fps: 60 },
          { quality: '1080p', ext: 'mp4', filesize_mb: 120.0, fps: 30 },
          { quality: '720p', ext: 'mp4', filesize_mb: 65.2, fps: 30 },
          { quality: '480p', ext: 'mp4', filesize_mb: 30.1, fps: 30 },
          { quality: '360p', ext: 'mp4', filesize_mb: 18.4, fps: 30 },
          { quality: '144p', ext: 'mp4', filesize_mb: 6.0, fps: 30 },
        ],
        audio_formats: [
          { quality: '320kbps', ext: 'mp3', filesize_mb: 9.6 },
          { quality: '192kbps', ext: 'mp3', filesize_mb: 5.8 },
          { quality: '128kbps', ext: 'mp3', filesize_mb: 3.9 },
        ],
      };
    }

    if (platform === 'tiktok') {
      return {
        id: `job_tt_${Date.now()}`,
        platform: 'tiktok',
        title: "Top 5 Tech Hacks You Didn't Know Existed! 🚀 #tech #hacks",
        thumbnail: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&q=80',
        duration_seconds: 48,
        uploader: '@tech_guru_official',
        video_formats: [
          { quality: '1080p (No Watermark)', ext: 'mp4', filesize_mb: 28.4, fps: 30 },
          { quality: '720p', ext: 'mp4', filesize_mb: 14.2, fps: 30 },
          { quality: '480p', ext: 'mp4', filesize_mb: 7.8, fps: 30 },
        ],
        audio_formats: [{ quality: '192kbps', ext: 'mp3', filesize_mb: 1.2 }],
      };
    }

    if (platform === 'instagram') {
      return {
        id: `job_ig_${Date.now()}`,
        platform: 'instagram',
        title: 'Sunset vibes at the coast 🌅 | Reel by @traveler_life',
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
        duration_seconds: 30,
        uploader: 'traveler_life',
        video_formats: [
          { quality: '1080p', ext: 'mp4', filesize_mb: 19.5, fps: 30 },
          { quality: '720p', ext: 'mp4', filesize_mb: 9.8, fps: 30 },
        ],
        audio_formats: [{ quality: '192kbps', ext: 'mp3', filesize_mb: 0.8 }],
      };
    }

    if (platform === 'facebook') {
      return {
        id: `job_fb_${Date.now()}`,
        platform: 'facebook',
        title: 'Trending Viral Video Reel | Facebook Watch',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
        duration_seconds: 85,
        uploader: 'Facebook Video Creator',
        video_formats: [
          { quality: '1080p (HD)', ext: 'mp4', filesize_mb: 52.0, fps: 30 },
          { quality: '720p (SD)', ext: 'mp4', filesize_mb: 26.5, fps: 30 },
          { quality: '480p', ext: 'mp4', filesize_mb: 14.0, fps: 30 },
        ],
        audio_formats: [{ quality: '192kbps', ext: 'mp3', filesize_mb: 2.0 }],
      };
    }

    if (platform === 'twitter') {
      return {
        id: `job_tw_${Date.now()}`,
        platform: 'twitter',
        title: 'Breaking News & Video Post on X',
        thumbnail: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&q=80',
        duration_seconds: 45,
        uploader: '@XCreator',
        video_formats: [
          { quality: '1080p', ext: 'mp4', filesize_mb: 32.0, fps: 30 },
          { quality: '720p', ext: 'mp4', filesize_mb: 16.5, fps: 30 },
          { quality: '480p', ext: 'mp4', filesize_mb: 8.2, fps: 30 },
        ],
        audio_formats: [{ quality: '192kbps', ext: 'mp3', filesize_mb: 1.1 }],
      };
    }

    return {
      id: `job_gen_${Date.now()}`,
      platform: 'unknown',
      title: 'Extracted Web Media Clip',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
      duration_seconds: 120,
      uploader: 'Web Source',
      video_formats: [
        { quality: '1080p', ext: 'mp4', filesize_mb: 45.0, fps: 30 },
        { quality: '720p', ext: 'mp4', filesize_mb: 22.0, fps: 30 },
        { quality: '480p', ext: 'mp4', filesize_mb: 11.0, fps: 30 },
      ],
      audio_formats: [{ quality: '192kbps', ext: 'mp3', filesize_mb: 2.8 }],
    };
  }

  // Real backend call
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errCode = errData.error_code || 'UNKNOWN';
      const formattedMessage = formatErrorMessage(errCode, errData.message || errData.detail);
      throw {
        error_code: errCode,
        message: formattedMessage,
      } as AnalyzeErrorResponse;
    }

    return await response.json();
  } catch (err: any) {
    if (err && err.error_code) {
      throw err;
    }
    // Network / fetch error
    throw {
      error_code: 'NETWORK_ERROR',
      message: formatErrorMessage('NETWORK_ERROR'),
    } as AnalyzeErrorResponse;
  }
}

/**
 * Start download contract: POST /api/v1/download
 */
export async function startDownload(
  id: string,
  format_type: 'video' | 'audio',
  quality: string
): Promise<DownloadJobResponse> {
  if (USE_MOCK) {
    const downloadJobId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    activeMockDownloads.set(downloadJobId, {
      progress: 0,
      status: 'processing',
      cancelled: false,
    });

    return {
      download_job_id: downloadJobId,
      status: 'queued',
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, format_type, quality }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errCode = errData.error_code || 'UNKNOWN';
      const message = formatErrorMessage(errCode, errData.message || 'Failed to initiate download job');
      throw new Error(message);
    }

    return await response.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error(formatErrorMessage('NETWORK_ERROR'));
  }
}

/**
 * Get download status contract: GET /api/v1/download/{download_job_id}/status
 */
export async function getDownloadStatus(
  downloadJobId: string
): Promise<DownloadStatusResponse> {
  if (USE_MOCK) {
    const mockItem = activeMockDownloads.get(downloadJobId);

    if (!mockItem) {
      return {
        status: 'processing',
        progress_percent: 15,
      };
    }

    if (mockItem.cancelled) {
      return {
        status: 'failed',
        progress_percent: mockItem.progress,
        error_message: 'Download cancelled by user.',
      };
    }

    mockItem.progress += Math.floor(Math.random() * 20) + 15;
    if (mockItem.progress >= 100) {
      mockItem.progress = 100;
      mockItem.status = 'ready';
      return {
        status: 'ready',
        progress_percent: 100,
        file_url: `https://downloads.local/media_${downloadJobId}.mp4`,
      };
    }

    return {
      status: 'processing',
      progress_percent: mockItem.progress,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/download/${downloadJobId}/status`);
    if (!response.ok) {
      throw new Error('Failed to get download status');
    }
    const data = await response.json();
    let rawFileUrl = data.file_url;
    if (rawFileUrl && (rawFileUrl.includes('localhost:8000') || rawFileUrl.includes('127.0.0.1:8000'))) {
      rawFileUrl = rawFileUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, API_BASE_URL);
    }
    return {
      status: data.status,
      progress_percent: data.progress_percent ?? 0,
      file_url: rawFileUrl,
      error_message: data.error_message || data.error,
    };
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error(formatErrorMessage('NETWORK_ERROR'));
  }
}

/**
 * Cancel download request
 */
export async function cancelDownload(downloadJobId: string): Promise<boolean> {
  const mockItem = activeMockDownloads.get(downloadJobId);
  if (mockItem) {
    mockItem.cancelled = true;
    mockItem.status = 'failed';
    return true;
  }
  return false;
}

/**
 * Download media file using expo-file-system and save to local gallery/downloads using expo-media-library
 */
export async function downloadAndSaveMedia(
  fileUrl: string,
  suggestedFilename?: string
): Promise<string> {
  try {
    const filename = suggestedFilename
      ? suggestedFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `media_${Date.now()}.mp4`;
    const targetPath = `${FileSystem.documentDirectory || ''}${filename}`;

    const downloadResult = await FileSystem.downloadAsync(fileUrl, targetPath);
    const localUri = downloadResult.uri;

    // Save to media library if permission granted
    try {
      if (MediaLibrary && typeof MediaLibrary.requestPermissionsAsync === 'function') {
        const permResult = await MediaLibrary.requestPermissionsAsync();
        if (permResult && permResult.status === 'granted') {
          await MediaLibrary.createAssetAsync(localUri);
        }
      }
    } catch (permError) {
      console.log('MediaLibrary permission or asset creation skipped:', permError);
    }

    return localUri;
  } catch (error) {
    console.error('Failed to download media file locally:', error);
    // Return fallback file URL if local file save fails or in non-native test environments
    return fileUrl;
  }
}

