import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import * as historyStorage from '../src/services/historyStorage';

describe('HistoryScreen Component', () => {
  beforeEach(async () => {
    await historyStorage.clearHistory();
  });

  test('renders history screen and empty state without crashing', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<HistoryScreen />);
    });

    const instance = tree.root;
    const historyScreen = instance.findByProps({ testID: 'history-screen' });
    expect(historyScreen).toBeTruthy();

    const emptyText = instance.findByProps({ testID: 'history-empty-text' });
    expect(emptyText).toBeTruthy();
  });

  test('displays history items and handles filter clicks', async () => {
    await historyStorage.saveHistoryItem({
      id: 'job_test1',
      title: 'Sample Download Video',
      quality: '1080p',
      format: 'video',
      status: 'completed',
    });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<HistoryScreen />);
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
