import {
  getHistory,
  saveHistoryItem,
  updateHistoryItemStatus,
  deleteHistoryItem,
  clearHistory,
  searchHistory,
  filterHistoryItems,
  DownloadHistoryItem,
} from '../src/services/historyStorage';

describe('Download History Storage Service', () => {
  beforeEach(async () => {
    await clearHistory();
  });

  test('saves and retrieves download history items', async () => {
    const item = await saveHistoryItem({
      id: 'job_123',
      title: 'Test Video 1',
      url: 'https://youtube.com/watch?v=123',
      platform: 'youtube',
      quality: '1080p',
      format: 'video',
      status: 'completed',
    });

    expect(item.id).toBe('job_123');
    expect(item.timestamp).toBeTruthy();

    const history = await getHistory();
    expect(history.length).toBe(1);
    expect(history[0].title).toBe('Test Video 1');
  });

  test('updates status and metadata of an existing history item', async () => {
    await saveHistoryItem({
      id: 'job_456',
      title: 'Downloading Video',
      quality: '720p',
      format: 'video',
      status: 'processing',
    });

    const updated = await updateHistoryItemStatus('job_456', 'completed', {
      filePath: 'file:///local/video.mp4',
    });

    expect(updated).toBeTruthy();
    expect(updated?.status).toBe('completed');
    expect(updated?.filePath).toBe('file:///local/video.mp4');

    const history = await getHistory();
    expect(history[0].status).toBe('completed');
  });

  test('deletes a single history item and clears all history', async () => {
    await saveHistoryItem({ id: 'job_1', title: 'Video 1', quality: '1080p', format: 'video', status: 'completed' });
    await saveHistoryItem({ id: 'job_2', title: 'Video 2', quality: '720p', format: 'video', status: 'completed' });

    let history = await getHistory();
    expect(history.length).toBe(2);

    const deleted = await deleteHistoryItem('job_1');
    expect(deleted).toBe(true);

    history = await getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('job_2');

    await clearHistory();
    history = await getHistory();
    expect(history.length).toBe(0);
  });

  test('filters history by search query and status', () => {
    const mockItems: DownloadHistoryItem[] = [
      { id: '1', title: 'React Native Tutorial', quality: '1080p', format: 'video', status: 'completed', timestamp: '2026-01-01' },
      { id: '2', title: 'TypeScript Deep Dive', quality: '720p', format: 'video', status: 'failed', timestamp: '2026-01-02' },
      { id: '3', title: 'Lo-fi Music Track', quality: '320k', format: 'audio', status: 'completed', timestamp: '2026-01-03' },
    ];

    const completedOnly = filterHistoryItems(mockItems, '', 'Completed');
    expect(completedOnly.length).toBe(2);

    const failedOnly = filterHistoryItems(mockItems, '', 'Failed');
    expect(failedOnly.length).toBe(1);
    expect(failedOnly[0].id).toBe('2');

    const querySearch = filterHistoryItems(mockItems, 'lo-fi', 'All');
    expect(querySearch.length).toBe(1);
    expect(querySearch[0].id).toBe('3');
  });
});
