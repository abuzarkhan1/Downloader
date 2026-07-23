import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QuickShareSheet, detectPlatformFromUrl } from '../src/components/QuickShareSheet';
import * as apiModule from '../src/services/api';
import { AnalyzeResponse } from '../src/types';

const mockAnalyzeData: AnalyzeResponse = {
  id: 'job_test_123',
  platform: 'youtube',
  title: 'Sample Test Video',
  thumbnail: 'https://example.com/thumb.jpg',
  duration_seconds: 120,
  uploader: 'Test Channel',
  video_formats: [
    { quality: '1080p', ext: 'mp4', filesize_mb: 100.5, fps: 30 },
    { quality: '720p', ext: 'mp4', filesize_mb: 50.2, fps: 30 },
  ],
  audio_formats: [
    { quality: '192kbps', ext: 'mp3', filesize_mb: 4.5 },
  ],
};

describe('QuickShareSheet Component & Intent Integration', () => {
  let analyzeSpy: jest.SpyInstance;
  let startDownloadSpy: jest.SpyInstance;
  let getStatusSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    analyzeSpy = jest.spyOn(apiModule, 'analyzeUrl').mockResolvedValue(mockAnalyzeData);
    startDownloadSpy = jest.spyOn(apiModule, 'startDownload').mockResolvedValue({
      download_job_id: 'dl_job_999',
      status: 'queued',
    });
    getStatusSpy = jest.spyOn(apiModule, 'getDownloadStatus').mockResolvedValue({
      status: 'processing',
      progress_percent: 45,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('detectPlatformFromUrl', () => {
    test('correctly identifies platforms from URL strings', () => {
      expect(detectPlatformFromUrl('https://youtube.com/watch?v=123')).toBe('youtube');
      expect(detectPlatformFromUrl('https://tiktok.com/@user/video/123')).toBe('tiktok');
      expect(detectPlatformFromUrl('https://instagram.com/p/123')).toBe('instagram');
      expect(detectPlatformFromUrl('https://facebook.com/watch/?v=123')).toBe('facebook');
      expect(detectPlatformFromUrl('https://example.com/video.mp4')).toBe('unknown');
    });
  });

  describe('Rendering', () => {
    test('does not render when visible is false', () => {
      let tree: any;
      act(() => {
        tree = renderer.create(
          <QuickShareSheet
            visible={false}
            sharedUrl="https://youtube.com/watch?v=123"
            onClose={jest.fn()}
            onOpenMainApp={jest.fn()}
          />
        );
      });
      expect(tree.toJSON()).toBeNull();
    });

    test('renders sheet container and triggers URL analysis when visible', async () => {
      const onCloseMock = jest.fn();
      let tree: any;

      await act(async () => {
        tree = renderer.create(
          <QuickShareSheet
            visible={true}
            sharedUrl="https://youtube.com/watch?v=123"
            onClose={onCloseMock}
          />
        );
      });

      expect(analyzeSpy).toHaveBeenCalledWith('https://youtube.com/watch?v=123');

      const instance = tree.root;
      const sheetModal = instance.findByProps({ testID: 'quick-share-sheet' });
      expect(sheetModal).toBeTruthy();
    });
  });

  describe('URL Analysis & Format Selection', () => {
    test('renders video and audio format choices and allows format selection', async () => {
      const onSelectFormatMock = jest.fn();
      let tree: any;

      await act(async () => {
        tree = renderer.create(
          <QuickShareSheet
            visible={true}
            sharedUrl="https://youtube.com/watch?v=123"
            onClose={jest.fn()}
            onSelectFormat={onSelectFormatMock}
          />
        );
      });

      const instance = tree.root;
      const format1080p = instance.findByProps({ testID: 'format-option-1080p' });
      expect(format1080p).toBeTruthy();

      await act(async () => {
        format1080p.props.onPress();
      });
    });

    test('triggers startDownload and polls status on pressing Download Now', async () => {
      let tree: any;
      await act(async () => {
        tree = renderer.create(
          <QuickShareSheet
            visible={true}
            sharedUrl="https://youtube.com/watch?v=123"
            onClose={jest.fn()}
          />
        );
      });

      const instance = tree.root;
      const downloadBtn = instance.findByProps({ testID: 'quick-share-download-btn' });

      await act(async () => {
        await downloadBtn.props.onPress();
      });

      expect(startDownloadSpy).toHaveBeenCalledWith('job_test_123', 'video', '1080p');

      await act(async () => {
        jest.advanceTimersByTime(850);
      });

      expect(getStatusSpy).toHaveBeenCalledWith('dl_job_999');

      const progressText = instance.findByProps({ testID: 'quick-share-progress-text' });
      expect(progressText.props.children.join('')).toBe('45%');
    });
  });

  describe('Closing Actions', () => {
    test('triggers onClose when close button is pressed', async () => {
      const onCloseMock = jest.fn();
      let tree: any;

      await act(async () => {
        tree = renderer.create(
          <QuickShareSheet
            visible={true}
            sharedUrl="https://youtube.com/watch?v=123"
            onClose={onCloseMock}
          />
        );
      });

      const instance = tree.root;
      const closeBtn = instance.findByProps({ testID: 'quick-share-close-btn' });

      act(() => {
        closeBtn.props.onPress();
      });

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    test('calls onOpenMainApp when Open Full App button is pressed', async () => {
      const onOpenMainAppMock = jest.fn();
      let tree: any;

      await act(async () => {
        tree = renderer.create(
          <QuickShareSheet
            visible={true}
            sharedUrl="https://youtube.com/watch?v=123"
            onClose={jest.fn()}
            onOpenMainApp={onOpenMainAppMock}
          />
        );
      });

      const instance = tree.root;
      const openAppBtn = instance.findByProps({ testID: 'quick-share-open-app-btn' });

      act(() => {
        openAppBtn.props.onPress();
      });

      expect(onOpenMainAppMock).toHaveBeenCalledTimes(1);
    });
  });
});
