import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { DownloadScreen } from '../src/screens/DownloadScreen';
import * as apiModule from '../src/services/api';

describe('DownloadScreen Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    apiModule.setUseMock(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders progress bar and downloading status without crashing', () => {
    const onCancelMock = jest.fn();
    const onDownloadAnotherMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(
        <DownloadScreen
          statusData={{ status: 'processing', progress_percent: 45 }}
          selectedQuality="1080p"
          formatType="video"
          title="Sample Video Title"
          onCancel={onCancelMock}
          onDownloadAnother={onDownloadAnotherMock}
        />
      );
    });

    const instance = tree.root;
    const downloadScreen = instance.findByProps({ testID: 'download-screen' });
    expect(downloadScreen).toBeTruthy();

    const progressCard = instance.findByProps({ testID: 'progress-card' });
    expect(progressCard).toBeTruthy();
  });

  test('polls status when downloadJobId is provided', async () => {
    const getStatusSpy = jest.spyOn(apiModule, 'getDownloadStatus').mockResolvedValue({
      status: 'processing',
      progress_percent: 60,
    });

    let tree: any;
    act(() => {
      tree = renderer.create(
        <DownloadScreen
          downloadJobId="dl_test_123"
          selectedQuality="1080p"
          formatType="video"
          title="Polling Video Title"
          onCancel={jest.fn()}
          onDownloadAnother={jest.fn()}
        />
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(1050);
    });

    expect(getStatusSpy).toHaveBeenCalledWith('dl_test_123');
  });

  test('renders completion confirmation and action buttons when status is ready', async () => {
    const onCancelMock = jest.fn();
    const onDownloadAnotherMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <DownloadScreen
          statusData={{ status: 'ready', progress_percent: 100, local_uri: 'file:///local/media.mp4' }}
          selectedQuality="1080p"
          formatType="video"
          title="Sample Video Title"
          onCancel={onCancelMock}
          onDownloadAnother={onDownloadAnotherMock}
        />
      );
    });

    const instance = tree.root;
    const completionActions = instance.findByProps({ testID: 'download-completion-actions' });
    expect(completionActions).toBeTruthy();

    const openBtn = instance.findByProps({ testID: 'btn-open-file' });
    expect(openBtn).toBeTruthy();
  });

  test('renders failure message when status is failed', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <DownloadScreen
          statusData={{ status: 'failed', progress_percent: 0, error_message: 'Rate limit exceeded. Try again in a few minutes.' }}
          selectedQuality="1080p"
          formatType="video"
          title="Failed Video Title"
          onCancel={jest.fn()}
          onDownloadAnother={jest.fn()}
        />
      );
    });

    const instance = tree.root;
    const retryBtn = instance.findByProps({ testID: 'btn-retry-home' });
    expect(retryBtn).toBeTruthy();
  });
});
