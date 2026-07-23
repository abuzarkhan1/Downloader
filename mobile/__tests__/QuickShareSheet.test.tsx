import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QuickShareSheet } from '../src/components/QuickShareSheet';
import * as apiModule from '../src/services/api';
import { AnalyzeResponse } from '../src/types';

jest.mock('../src/services/api', () => ({
  detectPlatform: jest.fn().mockReturnValue('youtube'),
  analyzeUrl: jest.fn(),
  startDownload: jest.fn(),
  getDownloadStatus: jest.fn(),
  downloadAndSaveMedia: jest.fn().mockResolvedValue('/mock/path/video.mp4'),
  formatErrorMessage: jest.fn().mockReturnValue('Formatted Error'),
}));

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

describe('QuickShareSheet Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  test('auto-triggers analyzeUrl and renders media info + format options when visible', async () => {
    (apiModule.analyzeUrl as jest.Mock).mockResolvedValue(mockAnalyzeData);

    const onCloseMock = jest.fn();
    const onOpenMainAppMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <QuickShareSheet
          visible={true}
          sharedUrl="https://youtube.com/watch?v=123"
          onClose={onCloseMock}
          onOpenMainApp={onOpenMainAppMock}
        />
      );
    });

    expect(apiModule.analyzeUrl).toHaveBeenCalledWith('https://youtube.com/watch?v=123');

    const instance = tree.root;
    const sheetModal = instance.findByProps({ testID: 'quick-share-sheet' });
    expect(sheetModal).toBeTruthy();

    const format1080p = instance.findByProps({ testID: 'format-option-1080p' });
    expect(format1080p).toBeTruthy();
  });

  test('triggers startDownload and polls progress on pressing Download Now', async () => {
    (apiModule.analyzeUrl as jest.Mock).mockResolvedValue(mockAnalyzeData);
    (apiModule.startDownload as jest.Mock).mockResolvedValue({
      download_job_id: 'dl_job_999',
      status: 'queued',
    });
    (apiModule.getDownloadStatus as jest.Mock).mockResolvedValue({
      status: 'processing',
      progress_percent: 45,
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <QuickShareSheet
          visible={true}
          sharedUrl="https://youtube.com/watch?v=123"
          onClose={jest.fn()}
          onOpenMainApp={jest.fn()}
        />
      );
    });

    const instance = tree.root;
    const downloadBtn = instance.findByProps({ testID: 'quick-share-download-btn' });

    await act(async () => {
      await downloadBtn.props.onPress();
    });

    expect(apiModule.startDownload).toHaveBeenCalledWith('job_test_123', 'video', '1080p');

    // Fast forward timer to trigger polling
    await act(async () => {
      jest.advanceTimersByTime(850);
    });

    expect(apiModule.getDownloadStatus).toHaveBeenCalledWith('dl_job_999');

    const progressText = instance.findByProps({ testID: 'quick-share-progress-text' });
    expect(progressText.props.children.join('')).toBe('45%');
  });

  test('calls onOpenMainApp when Open Full App is pressed', async () => {
    (apiModule.analyzeUrl as jest.Mock).mockResolvedValue(mockAnalyzeData);
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
