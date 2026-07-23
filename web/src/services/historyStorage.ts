export interface DownloadHistoryItem {
  id: string;
  mediaId: string;
  title: string;
  thumbnailUrl: string;
  uploader: string;
  platform: string;
  formatType: 'video' | 'audio';
  quality: string;
  extension: string;
  filesize?: string;
  status: 'Completed' | 'Processing' | 'Failed' | 'queued' | string;
  timestamp: number;
  fileUrl?: string | null;
  url?: string;
}

const STORAGE_KEY = "videodownloader_history";

export function getHistory(): DownloadHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read history from LocalStorage", err);
    return [];
  }
}

export function saveHistoryItem(
  item: Omit<DownloadHistoryItem, "timestamp"> & { timestamp?: number }
): DownloadHistoryItem {
  if (typeof window === "undefined") {
    return { ...item, timestamp: item.timestamp || Date.now() };
  }
  const history = getHistory();
  const newItem: DownloadHistoryItem = {
    ...item,
    timestamp: item.timestamp || Date.now(),
  };

  // Remove existing item with same id if present to move to top
  const filtered = history.filter((i) => i.id !== newItem.id);
  const updated = [newItem, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save history item to LocalStorage", err);
  }
  return newItem;
}

export function updateHistoryItemStatus(
  id: string,
  status: string,
  fileUrl?: string
): void {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const index = history.findIndex((i) => i.id === id);
  if (index !== -1) {
    history[index].status = status;
    if (fileUrl) {
      history[index].fileUrl = fileUrl;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Failed to update history item status", err);
    }
  }
}

export function deleteHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const filtered = history.filter((i) => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to delete history item from LocalStorage", err);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear history from LocalStorage", err);
  }
}

export function searchHistory(
  query: string,
  statusFilter: string = "All"
): DownloadHistoryItem[] {
  const history = getHistory();
  const q = query.trim().toLowerCase();

  return history.filter((item) => {
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.uploader.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q) ||
      item.quality.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "All" ||
      item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesQuery && matchesStatus;
  });
}
