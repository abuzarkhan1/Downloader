export const DISCLAIMER_ACCEPTED_KEY = '@disclaimer_accepted_at';

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Fallback for environments where native module is unlinked/mocked
}

const memoryStore: Record<string, string> = {};

/**
 * Retrieves saved ISO timestamp of disclaimer acceptance from local storage.
 * Returns null if disclaimer has not been accepted yet.
 */
export const getDisclaimerAcceptedAt = async (): Promise<string | null> => {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const value = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
      if (value) return value;
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  // Fallback for Web / LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const value = window.localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
      if (value) return value;
    } catch (e) {}
  }

  // In-memory fallback (useful during unit tests)
  return memoryStore[DISCLAIMER_ACCEPTED_KEY] || null;
};

/**
 * Saves current ISO timestamp string to local storage under @disclaimer_accepted_at.
 */
export const saveDisclaimerAcceptedAt = async (timestamp?: string): Promise<string> => {
  const isoTimestamp = timestamp || new Date().toISOString();

  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, isoTimestamp);
    }
  } catch (error) {
    // Fallthrough to fallback storage
  }

  // Fallback for Web / LocalStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, isoTimestamp);
    } catch (e) {}
  }

  memoryStore[DISCLAIMER_ACCEPTED_KEY] = isoTimestamp;
  return isoTimestamp;
};
