import { create } from 'zustand';

export interface DownloadItem {
  id: string;
  url: string;
  title?: string;
  progress: number;
  status: 'downloading' | 'ready' | 'failed' | 'cancelled';
  error?: string;
}

interface DownloadState {
  activeDownloads: DownloadItem[];
  
  addDownloadItem: (item: Omit<DownloadItem, 'status' | 'progress'>) => void;
  updateDownloadProgress: (id: string, progress: number) => void;
  markDownloadReady: (id: string) => void;
  markDownloadFailed: (id: string, error?: string) => void;
  cancelDownload: (id: string) => void;
  clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  activeDownloads: [],

  addDownloadItem: (item) =>
    set((state) => ({
      activeDownloads: [
        ...state.activeDownloads,
        { ...item, progress: 0, status: 'downloading' },
      ],
    })),

  updateDownloadProgress: (id, progress) =>
    set((state) => ({
      activeDownloads: state.activeDownloads.map((item) =>
        item.id === id ? { ...item, progress } : item
      ),
    })),

  markDownloadReady: (id) =>
    set((state) => ({
      activeDownloads: state.activeDownloads.map((item) =>
        item.id === id ? { ...item, status: 'ready', progress: 100 } : item
      ),
    })),

  markDownloadFailed: (id, error) =>
    set((state) => ({
      activeDownloads: state.activeDownloads.map((item) =>
        item.id === id ? { ...item, status: 'failed', error } : item
      ),
    })),

  cancelDownload: (id) =>
    set((state) => ({
      activeDownloads: state.activeDownloads.map((item) =>
        item.id === id ? { ...item, status: 'cancelled' } : item
      ),
    })),

  clearCompleted: () =>
    set((state) => ({
      activeDownloads: state.activeDownloads.filter(
        (item) => item.status === 'downloading'
      ),
    })),
}));
