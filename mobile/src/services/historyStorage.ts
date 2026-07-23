import { DownloadHistoryItem, DownloadHistoryStatus } from '../types';

export const HISTORY_STORAGE_KEY = '@download_history';

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback for environments where native module is unlinked/mocked
}

let memoryHistory: DownloadHistoryItem[] = [];

/**
 * Retrieves all download history items from storage.
 */
export const getHistory = async (): Promise<DownloadHistoryItem[]> => {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const json = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (json) {
        memoryHistory = JSON.parse(json);
        return memoryHistory;
      }
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const json = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (json) {
        memoryHistory = JSON.parse(json);
        return memoryHistory;
      }
    } catch (e) {}
  }

  return memoryHistory;
};

/**
 * Saves or updates a download history item.
 */
export const saveHistoryItem = async (
  item: Omit<DownloadHistoryItem, 'timestamp'> & { timestamp?: string }
): Promise<DownloadHistoryItem> => {
  const currentHistory = await getHistory();
  const newItem: DownloadHistoryItem = {
    ...item,
    timestamp: item.timestamp || new Date().toISOString(),
  };

  const existingIdx = currentHistory.findIndex((h) => h.id === newItem.id);
  let updated: DownloadHistoryItem[];

  if (existingIdx >= 0) {
    updated = [...currentHistory];
    updated[existingIdx] = { ...updated[existingIdx], ...newItem };
  } else {
    updated = [newItem, ...currentHistory];
  }

  memoryHistory = updated;
  await persistHistory(updated);
  return newItem;
};

/**
 * Updates status and optional metadata of an existing history item.
 */
export const updateHistoryItemStatus = async (
  id: string,
  status: DownloadHistoryStatus,
  extra?: Partial<DownloadHistoryItem>
): Promise<DownloadHistoryItem | null> => {
  const currentHistory = await getHistory();
  const existingIdx = currentHistory.findIndex((h) => h.id === id);
  if (existingIdx === -1) return null;

  const updatedItem: DownloadHistoryItem = {
    ...currentHistory[existingIdx],
    status,
    ...extra,
  };

  const updated = [...currentHistory];
  updated[existingIdx] = updatedItem;
  memoryHistory = updated;
  await persistHistory(updated);
  return updatedItem;
};

/**
 * Deletes a download history item by ID.
 */
export const deleteHistoryItem = async (id: string): Promise<boolean> => {
  const currentHistory = await getHistory();
  const updated = currentHistory.filter((h) => h.id !== id);
  const removed = updated.length < currentHistory.length;
  memoryHistory = updated;
  await persistHistory(updated);
  return removed;
};

/**
 * Clears all history items.
 */
export const clearHistory = async (): Promise<void> => {
  memoryHistory = [];
  await persistHistory([]);
};

/**
 * Searches and filters download history items by text query and status filter.
 */
export const searchHistory = async (
  query: string = '',
  statusFilter: 'All' | 'Completed' | 'Processing' | 'Failed' = 'All'
): Promise<DownloadHistoryItem[]> => {
  const currentHistory = await getHistory();
  return filterHistoryItems(currentHistory, query, statusFilter);
};

/**
 * Pure helper for filtering history items array by query string & status.
 */
export const filterHistoryItems = (
  items: DownloadHistoryItem[],
  query: string = '',
  statusFilter: 'All' | 'Completed' | 'Processing' | 'Failed' = 'All'
): DownloadHistoryItem[] => {
  const cleanQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    // Status Filter match
    if (statusFilter === 'Completed' && item.status !== 'completed') return false;
    if (statusFilter === 'Processing' && item.status !== 'processing') return false;
    if (statusFilter === 'Failed' && item.status !== 'failed') return false;

    // Text Query match
    if (cleanQuery.length > 0) {
      const matchTitle = item.title.toLowerCase().includes(cleanQuery);
      const matchUploader = item.uploader ? item.uploader.toLowerCase().includes(cleanQuery) : false;
      const matchUrl = item.url ? item.url.toLowerCase().includes(cleanQuery) : false;
      const matchQuality = item.quality.toLowerCase().includes(cleanQuery);
      const matchPlatform = item.platform ? item.platform.toLowerCase().includes(cleanQuery) : false;

      return matchTitle || matchUploader || matchUrl || matchQuality || matchPlatform;
    }

    return true;
  });
};

/**
 * Helper to prepare re-download params for a history item.
 */
export const prepareRedownloadParams = (item: DownloadHistoryItem) => {
  return {
    url: item.url || '',
    formatType: item.format,
    quality: item.quality,
    title: item.title,
  };
};

/**
 * Helper internal persistence writer.
 */
const persistHistory = async (items: DownloadHistoryItem[]): Promise<void> => {
  const json = JSON.stringify(items);

  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, json);
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, json);
    } catch (e) {}
  }
};
