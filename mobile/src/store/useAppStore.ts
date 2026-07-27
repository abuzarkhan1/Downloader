import { create } from 'zustand';

export type ThemeAccent = 'Midnight Neon' | 'Cyberpunk' | 'Emerald Dark' | 'OLED Deep Blue';

interface AppState {
  activeNavTab: string;
  batchMode: boolean;
  noWatermark: boolean;
  quickShareVisible: boolean;
  quickShareUrl: string | null;
  disclaimerVisible: boolean;
  errorModal: { visible: boolean; title: string; message: string; detail: string | null };
  currentThemeAccent: ThemeAccent;
  hasSeenOnboarding: boolean;
  
  setActiveNavTab: (tab: string) => void;
  setBatchMode: (batchMode: boolean) => void;
  setNoWatermark: (noWatermark: boolean) => void;
  setQuickShareVisible: (visible: boolean) => void;
  setQuickShareUrl: (url: string | null) => void;
  setDisclaimerVisible: (visible: boolean) => void;
  setErrorModal: (visible: boolean, title?: string, message?: string, detail?: string | null) => void;
  setCurrentThemeAccent: (theme: ThemeAccent) => void;
  setHasSeenOnboarding: (hasSeen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeNavTab: 'Home',
  batchMode: false,
  noWatermark: true,
  quickShareVisible: false,
  quickShareUrl: null,
  disclaimerVisible: false,
  errorModal: { visible: false, title: 'Error', message: '', detail: null },
  currentThemeAccent: 'Midnight Neon',
  hasSeenOnboarding: false,

  setActiveNavTab: (tab) => set({ activeNavTab: tab }),
  setBatchMode: (batchMode) => set({ batchMode }),
  setNoWatermark: (noWatermark) => set({ noWatermark }),
  setQuickShareVisible: (visible) => set({ quickShareVisible: visible }),
  setQuickShareUrl: (url) => set({ quickShareUrl: url }),
  setDisclaimerVisible: (visible) => set({ disclaimerVisible: visible }),
  setErrorModal: (visible, title = 'Error', message = '', detail = null) => 
    set({ errorModal: { visible, title, message, detail } }),
  setCurrentThemeAccent: (theme: ThemeAccent) => set({ currentThemeAccent: theme }),
  setHasSeenOnboarding: (hasSeen: boolean) => set({ hasSeenOnboarding: hasSeen }),
}));
