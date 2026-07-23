import { UserSettings } from '../types';

export const SETTINGS_STORAGE_KEY = '@user_settings';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  defaultQuality: '1080p',
  audioCodec: 'MP3',
  audioBitrate: '320k',
  sponsorBlock: true,
  subtitles: false,
  darkMode: 'dark',
  autoDownloadClipboard: false,
  downloadDirectory: '/Downloads/Seal',
  remuxMkv: false,
  cropArtwork: false,
  embedSubtitles: false,
  cookiesStr: '',
  proxyUrl: '',
  subtitleLang: 'en',
  startTime: '',
  endTime: '',
};

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback for environments where native module is unlinked/mocked
}

let memorySettings: UserSettings = { ...DEFAULT_USER_SETTINGS };

/**
 * Retrieves saved user settings with fallbacks to default values.
 */
export const getSettings = async (): Promise<UserSettings> => {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const json = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (json) {
        memorySettings = { ...DEFAULT_USER_SETTINGS, ...JSON.parse(json) };
        return memorySettings;
      }
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const json = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (json) {
        memorySettings = { ...DEFAULT_USER_SETTINGS, ...JSON.parse(json) };
        return memorySettings;
      }
    } catch (e) {}
  }

  return memorySettings;
};

/**
 * Updates user settings partially or fully.
 */
export const saveSettings = async (
  partialSettings: Partial<UserSettings>
): Promise<UserSettings> => {
  const current = await getSettings();
  const updated: UserSettings = {
    ...current,
    ...partialSettings,
  };

  memorySettings = updated;
  const json = JSON.stringify(updated);

  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, json);
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, json);
    } catch (e) {}
  }

  return updated;
};

/**
 * Resets user settings to default values.
 */
export const resetSettings = async (): Promise<UserSettings> => {
  memorySettings = { ...DEFAULT_USER_SETTINGS };
  const json = JSON.stringify(DEFAULT_USER_SETTINGS);

  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, json);
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, json);
    } catch (e) {}
  }

  return memorySettings;
};
