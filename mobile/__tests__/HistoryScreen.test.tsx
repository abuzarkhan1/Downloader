import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import { DownloadHistoryItem } from '../src/types';

describe('HistoryScreen Component', () => {
  test('renders history screen and empty state without crashing', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<HistoryScreen initialItems={[]} />);
    });

    const instance = tree.root;
    const emptyText = instance.findByProps({ testID: 'history-empty-text' });
    expect(emptyText).toBeTruthy();
  });

  test('displays history items and handles filter clicks', async () => {
    const mockItems: DownloadHistoryItem[] = [
      {
        id: 'job_test1',
        title: 'Sample Download Video',
        quality: '1080p',
        format: 'video',
        status: 'completed',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    ];

    let tree: any;
    await act(async () => {
      tree = renderer.create(<HistoryScreen initialItems={mockItems} />);
    });

    const instance = tree.root;
    const itemCard = instance.findByProps({ testID: 'history-item-job_test1' });
    expect(itemCard).toBeTruthy();

    const filterCompleted = instance.findByProps({ testID: 'history-filter-completed' });
    await act(async () => {
      filterCompleted.props.onPress();
    });
  });
});
