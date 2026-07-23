export interface UserSettings {
  defaultQuality: '1080p' | '720p' | '480p' | 'best' | string;
  audioCodec: 'mp3' | 'm4a' | 'flac' | 'opus';
  audioBitrate: '128k' | '192k' | '320k';
  sponsorblockRemove: boolean;
  embedSubtitles: boolean;
  oledDarkMode: boolean;
  netscapeCookies: string;
  proxyUrl: string;
  maxFilesize: string;
  rateLimit: string;
  restrictFilenames: boolean;
  forceIpv4: boolean;
  outputTemplate: string;
  remuxMkv: boolean;
  cropArtwork: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultQuality: '1080p',
  audioCodec: 'mp3',
  audioBitrate: '320k',
  sponsorblockRemove: false,
  embedSubtitles: false,
  oledDarkMode: true,
  netscapeCookies: '',
  proxyUrl: '',
  maxFilesize: '',
  rateLimit: '',
  restrictFilenames: false,
  forceIpv4: false,
  outputTemplate: '%(title)s.%(ext)s',
  remuxMkv: false,
  cropArtwork: false,
};

const STORAGE_KEY = 'videodownloader_settings';

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Failed to read settings from LocalStorage', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(partialSettings: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const updated: UserSettings = { ...current, ...partialSettings };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save settings to LocalStorage', err);
    }
  }
  return updated;
}

export function resetSettings(): UserSettings {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to reset settings in LocalStorage', err);
    }
  }
  return { ...DEFAULT_SETTINGS };
}
