import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  platform: string;
  quality: string;
  formatType: 'video' | 'audio' | 'subtitle';
  fileSizeMb?: number;
  localPath?: string;
  downloadedAt: string; // ISO string
  thumbnailUrl?: string;
}

const HISTORY_STORAGE_KEY = '@video_downloader_history_v1';

export async function getHistoryItems(): Promise<HistoryItem[]> {
  try {
    const json = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (e) {
    return [];
  }
}

export async function addHistoryItem(item: Omit<HistoryItem, 'id' | 'downloadedAt'>): Promise<HistoryItem> {
  const newItem: HistoryItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    downloadedAt: new Date().toISOString(),
  };

  try {
    const current = await getHistoryItems();
    const updated = [newItem, ...current.filter(h => h.url !== newItem.url || h.quality !== newItem.quality)];
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage errors
  }

  return newItem;
}

export async function removeHistoryItem(id: string): Promise<void> {
  try {
    const current = await getHistoryItems();
    const updated = current.filter(h => h.id !== id);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore
  }
}

export async function clearAllHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
}
