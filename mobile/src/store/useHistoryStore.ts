import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  thumbnailIsFallback?: boolean;
}

interface HistoryState {
  historyItems: HistoryItem[];
  
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'downloadedAt'>) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      historyItems: [],
      
      addHistoryItem: (item) =>
        set((state) => {
          const newItem: HistoryItem = {
            ...item,
            id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            downloadedAt: new Date().toISOString(),
          };
          const filtered = state.historyItems.filter((i) => i.url !== item.url || i.quality !== item.quality);
          return { historyItems: [newItem, ...filtered] };
        }),
        
      removeHistoryItem: (id) =>
        set((state) => ({
          historyItems: state.historyItems.filter((item) => item.id !== id),
        })),
        
      clearHistory: () => set({ historyItems: [] }),
    }),
    {
      name: 'history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
