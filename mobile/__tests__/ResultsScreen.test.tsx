import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ResultsScreen } from '../src/screens/ResultsScreen';
import { AnalyzeResponse } from '../src/types';

const mockData: AnalyzeResponse = {
  id: 'job_test123',
  platform: 'youtube',
  title: 'Test Video Title',
  thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  duration_seconds: 180,
  uploader: 'Test Uploader',
  video_formats: [
    { quality: '1080p', ext: 'mp4', filesize_mb: 120, fps: 30 },
    { quality: '720p', ext: 'mp4', filesize_mb: 60, fps: 30 },
  ],
  audio_formats: [
    { quality: '192kbps', ext: 'mp3', filesize_mb: 5.5 },
  ],
};

describe('ResultsScreen Component', () => {
  test('renders media card, video tab, and qualities without crashing', () => {
    const onSelectFormatMock = jest.fn();
    const onBackMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(
        <ResultsScreen
          data={mockData}
          onSelectFormat={onSelectFormatMock}
          onBack={onBackMock}
        />
      );
    });

    const instance = tree.root;
    const resultsScreen = instance.findByProps({ testID: 'results-screen' });
    expect(resultsScreen).toBeTruthy();

    const videoFormatItem = instance.findByProps({ testID: 'video-format-1080p' });
    expect(videoFormatItem).toBeTruthy();

    const clipStartInput = instance.findByProps({ testID: 'clip-start-input' });
    const clipEndInput = instance.findByProps({ testID: 'clip-end-input' });
    expect(clipStartInput).toBeTruthy();
    expect(clipEndInput).toBeTruthy();
  });
});
