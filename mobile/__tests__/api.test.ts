import {
  detectPlatform,
  analyzeUrl,
  startDownload,
  getDownloadStatus,
  cancelDownload,
  formatErrorMessage,
  setUseMock,
  API_BASE_URL,
} from '../src/services/api';

describe('API Client & Mock Service', () => {
  beforeEach(() => {
    setUseMock(true);
    jest.restoreAllMocks();
  });

  test('detectPlatform correctly identifies platforms from URLs', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=123')).toBe('youtube');
    expect(detectPlatform('https://youtu.be/456')).toBe('youtube');
    expect(detectPlatform('https://www.tiktok.com/@user/video/789')).toBe('tiktok');
    expect(detectPlatform('https://www.instagram.com/reel/abc')).toBe('instagram');
    expect(detectPlatform('https://twitter.com/user/status/123456')).toBe('twitter');
    expect(detectPlatform('https://x.com/user/status/123456')).toBe('twitter');
    expect(detectPlatform('https://example.com/video.mp4')).toBe('unknown');
  });

  test('formatErrorMessage formats error codes per Section 6.1 spec', () => {
    expect(formatErrorMessage('UNSUPPORTED_URL')).toBe("This link isn't supported yet.");
    expect(formatErrorMessage('PRIVATE_CONTENT')).toBe("This content requires login and can't be processed.");
    expect(formatErrorMessage('RATE_LIMITED')).toBe('Rate limit exceeded. Try again in a few minutes.');
    expect(formatErrorMessage('PLATFORM_BLOCKED')).toBe('Platform blocked request. Try again later.');
    expect(formatErrorMessage('NETWORK_ERROR')).toBe('No internet connection.');
    expect(formatErrorMessage('UNKNOWN', 'Fallback message')).toBe('Fallback message');
  });

  describe('Mock Mode (USE_MOCK = true)', () => {
    beforeEach(() => {
      setUseMock(true);
    });

    test('analyzeUrl returns video and audio formats for valid YouTube link', async () => {
      const response = await analyzeUrl('https://www.youtube.com/watch?v=test');
      expect(response.platform).toBe('youtube');
      expect(response.title).toBeDefined();
      expect(response.video_formats.length).toBeGreaterThan(0);
      expect(response.audio_formats.length).toBeGreaterThan(0);
    });

    test('analyzeUrl returns video and audio formats for valid Twitter / X link', async () => {
      const response = await analyzeUrl('https://x.com/user/status/123456');
      expect(response.platform).toBe('twitter');
      expect(response.title).toBeDefined();
      expect(response.video_formats.length).toBeGreaterThan(0);
      expect(response.audio_formats.length).toBeGreaterThan(0);
    });

    test('analyzeUrl throws UNSUPPORTED_URL error for invalid URL', async () => {
      await expect(analyzeUrl('invalid_url')).rejects.toEqual(
        expect.objectContaining({
          error_code: 'UNSUPPORTED_URL',
          message: "This link isn't supported yet.",
        })
      );
    });

    test('analyzeUrl throws PRIVATE_CONTENT for private link', async () => {
      await expect(analyzeUrl('https://instagram.com/private/reel')).rejects.toEqual(
        expect.objectContaining({
          error_code: 'PRIVATE_CONTENT',
          message: "This content requires login and can't be processed.",
        })
      );
    });

    test('startDownload creates job ID and getDownloadStatus polls progress', async () => {
      const job = await startDownload('job_123', 'video', '1080p');
      expect(job.download_job_id).toBeDefined();
      expect(job.status).toBe('queued');

      const status1 = await getDownloadStatus(job.download_job_id);
      expect(status1.status).toBe('processing');
      expect(status1.progress_percent).toBeGreaterThanOrEqual(0);
    });

    test('cancelDownload updates status', async () => {
      const job = await startDownload('job_456', 'audio', '192kbps');
      const cancelled = await cancelDownload(job.download_job_id);
      expect(cancelled).toBe(true);

      const status = await getDownloadStatus(job.download_job_id);
      expect(status.status).toBe('failed');
    });
  });

  describe('Real Backend Mode (USE_MOCK = false)', () => {
    beforeEach(() => {
      setUseMock(false);
    });

    test('analyzeUrl calls real POST /api/v1/analyze endpoint', async () => {
      const mockBackendResponse = {
        id: 'job_real_123',
        platform: 'youtube',
        title: 'Real Backend Title',
        thumbnail: 'https://img.jpg',
        duration_seconds: 100,
        uploader: 'Real Uploader',
        video_formats: [{ quality: '1080p', ext: 'mp4', filesize_mb: 50, fps: 30 }],
        audio_formats: [{ quality: '192kbps', ext: 'mp3', filesize_mb: 5 }],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBackendResponse,
      } as any);

      const result = await analyzeUrl('https://www.youtube.com/watch?v=real');
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/analyze`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=real' }),
        })
      );
      expect(result.id).toBe('job_real_123');
    });

    test('analyzeUrl handles backend error responses (e.g. RATE_LIMITED)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error_code: 'RATE_LIMITED', message: 'Too many requests' }),
      } as any);

      await expect(analyzeUrl('https://youtube.com/watch?v=limit')).rejects.toEqual(
        expect.objectContaining({
          error_code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Try again in a few minutes.',
        })
      );
    });

    test('analyzeUrl handles network failure with NETWORK_ERROR message', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

      await expect(analyzeUrl('https://youtube.com/watch?v=netfail')).rejects.toEqual(
        expect.objectContaining({
          error_code: 'NETWORK_ERROR',
          message: 'No internet connection.',
        })
      );
    });

    test('startDownload calls real POST /api/v1/download endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ download_job_id: 'dl_real_789', status: 'queued' }),
      } as any);

      const res = await startDownload('job_real_123', 'video', '1080p');
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/download`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: 'job_real_123', format_type: 'video', quality: '1080p' }),
        })
      );
      expect(res.download_job_id).toBe('dl_real_789');
    });

    test('getDownloadStatus calls real GET /api/v1/download/{id}/status endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ready', progress_percent: 100, file_url: 'http://cdn/file.mp4' }),
      } as any);

      const status = await getDownloadStatus('dl_real_789');
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/v1/download/dl_real_789/status`);
      expect(status.status).toBe('ready');
      expect(status.file_url).toBe('http://cdn/file.mp4');
    });
  });
});
