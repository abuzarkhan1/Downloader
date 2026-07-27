import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HomeScreen } from '../src/screens/HomeScreen';
import { ResultsScreen } from '../src/screens/ResultsScreen';
import { I18nProvider } from '../src/i18n/I18nContext';
import { AnalyzeResponse } from '../src/types';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue('https://tiktok.com/@test/video/999'),
}));

const mockData: AnalyzeResponse = {
  id: 'job_test123',
  platform: 'youtube',
  title: 'Test Video Title',
  thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  duration_seconds: 180,
  uploader: 'Test Uploader',
  video_formats: [
    { quality: '1080p', ext: 'mp4', filesize_mb: 120, fps: 30 },
  ],
  audio_formats: [
    { quality: '192kbps', ext: 'mp3', filesize_mb: 5.5 },
  ],
  subtitles: [
    { language: 'English', code: 'en' },
    { language: 'Urdu', code: 'ur' },
  ],
};

import { useAppStore } from '../src/store/useAppStore';

describe('Mobile App Enhancements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({
      activeNavTab: 'Home',
      batchMode: false,
      noWatermark: true,
      quickShareVisible: false,
      quickShareUrl: null,
      disclaimerVisible: false,
      errorModal: { visible: false, title: 'Error', message: '', detail: null },
    });
  });

  test('1. Multi-Language (i18n) Support & Language Selector Toggle', async () => {
    const onAnalyzeMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <I18nProvider>
          <HomeScreen onAnalyze={onAnalyzeMock} />
        </I18nProvider>
      );
    });

    const instance = tree.root;
    const langToggleBtn = instance.findByProps({ testID: 'language-toggle-btn' });
    expect(langToggleBtn).toBeTruthy();

    // Toggle to Urdu
    await act(async () => {
      langToggleBtn.props.onPress();
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('میڈیا ڈاؤن لوڈر');
  });

  test('2. TikTok / Shorts Watermark Removal Switch (Default ON)', async () => {
    const onAnalyzeMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <I18nProvider>
          <HomeScreen onAnalyze={onAnalyzeMock} />
        </I18nProvider>
      );
    });

    const instance = tree.root;
    const switchComp = instance.findByProps({ testID: 'home-watermark-switch' });
    expect(switchComp.props.value).toBe(true);

    // Toggle switch off
    await act(async () => {
      switchComp.props.onValueChange(false);
    });

    expect(switchComp.props.value).toBe(false);
  });

  test('3. Playlist & Batch Multi-Link Downloader UI', async () => {
    const onAnalyzeMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <I18nProvider>
          <HomeScreen onAnalyze={onAnalyzeMock} />
        </I18nProvider>
      );
    });

    const instance = tree.root;
    const batchTab = instance.findByProps({ testID: 'mode-tab-batch' });

    // Switch to Batch mode
    await act(async () => {
      batchTab.props.onPress();
    });

    const batchInput = instance.findByProps({ testID: 'home-batch-input' });
    expect(batchInput).toBeTruthy();

    // Add 2 links into batch input
    await act(async () => {
      batchInput.props.onChangeText('https://youtube.com/watch?v=1\nhttps://youtube.com/watch?v=2');
    });

    const queueContainer = instance.findByProps({ testID: 'batch-queue-container' });
    expect(queueContainer).toBeTruthy();

    // Delete first item
    const removeBtn = instance.findByProps({ testID: 'remove-batch-item-0' });
    await act(async () => {
      removeBtn.props.onPress();
    });

    // Submit batch queue
    const submitBtn = instance.findByProps({ testID: 'home-submit-btn' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    expect(onAnalyzeMock).toHaveBeenCalledWith('https://youtube.com/watch?v=2', true);
  });

  test('4. Clipboard Auto-Detect Link Bottom Sheet Callback', async () => {
    const onAnalyzeMock = jest.fn();
    const onAutoDetectMock = jest.fn();

    await act(async () => {
      renderer.create(
        <I18nProvider>
          <HomeScreen onAnalyze={onAnalyzeMock} onAutoDetectUrl={onAutoDetectMock} />
        </I18nProvider>
      );
    });

    expect(onAutoDetectMock).toHaveBeenCalledWith('https://tiktok.com/@test/video/999');
  });

  test('5. Audio Bitrate & Format Selector UI in ResultsScreen', async () => {
    const onSelectFormatMock = jest.fn();
    const onBackMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <I18nProvider>
          <ResultsScreen
            data={mockData}
            onSelectFormat={onSelectFormatMock}
            onBack={onBackMock}
          />
        </I18nProvider>
      );
    });

    const instance = tree.root;
    const audioTab = instance.findByProps({ testID: 'tab-audio' });

    // Switch to Audio tab
    await act(async () => {
      audioTab.props.onPress();
    });

    const m4aFormatPill = instance.findByProps({ testID: 'audio-format-selector-m4a' });
    const bitrate320Pill = instance.findByProps({ testID: 'audio-bitrate-selector-320kbps' });

    await act(async () => {
      m4aFormatPill.props.onPress();
      bitrate320Pill.props.onPress();
    });

    const downloadAudioBtn = instance.findByProps({ testID: 'dl-btn-audio-192kbps' });
    await act(async () => {
      downloadAudioBtn.props.onPress();
    });

    expect(onSelectFormatMock).toHaveBeenCalledWith('audio', 'm4a-320kbps-192kbps');
  });

  test('6. Video & Audio standard 2-tab layout in ResultsScreen', async () => {
    const onSelectFormatMock = jest.fn();
    const onBackMock = jest.fn();
    let tree: any;

    await act(async () => {
      tree = renderer.create(
        <I18nProvider>
          <ResultsScreen
            data={mockData}
            onSelectFormat={onSelectFormatMock}
            onBack={onBackMock}
          />
        </I18nProvider>
      );
    });

    const instance = tree.root;
    const videoTab = instance.findByProps({ testID: 'tab-video' });
    const audioTab = instance.findByProps({ testID: 'tab-audio' });

    expect(videoTab).toBeTruthy();
    expect(audioTab).toBeTruthy();

    const subtitlesTab = instance.findAllByProps({ testID: 'tab-subtitles' });
    expect(subtitlesTab.length).toBe(0);
  });
});
