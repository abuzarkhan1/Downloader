import { Linking } from 'react-native';

/**
 * Extracts a valid http/https URL from arbitrary text (such as shared text from social media apps).
 * E.g., "Check out this reel https://www.instagram.com/reel/123/" -> "https://www.instagram.com/reel/123/"
 *
 * @param text Shared text or deep link string
 * @returns Extracted http/https URL string or null if not found
 */
export function parseSharedUrl(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  // Check for deep link query param (e.g. downloader://share?url=https://...)
  if (trimmed.includes('url=')) {
    try {
      const match = trimmed.match(/url=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          return decoded;
        }
      }
    } catch {
      // Fall through
    }
  }

  // Regex to match http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  let match = trimmed.match(urlRegex);

  // If no direct match, check if string contains percent-encoded URL
  if (!match && trimmed.includes('%')) {
    try {
      const decoded = decodeURIComponent(trimmed);
      match = decoded.match(urlRegex);
    } catch {
      // Ignore decode error
    }
  }

  if (!match) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return null;
  }

  let extracted = match[0].trim();

  // Strip trailing punctuation commonly appended in shared text or sentences
  extracted = extracted.replace(/[.,!?)"']+$/, '');

  try {
    const parsed = new URL(extracted);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    if (extracted.startsWith('http://') || extracted.startsWith('https://')) {
      return extracted;
    }
  }

  return null;
}

/** Alias for parseSharedUrl */
export const extractSharedUrl = parseSharedUrl;

/**
 * Retrieves the initial shared URL or deep link when the app launches.
 *
 * @returns Promise resolving to valid extracted URL or null
 */
export async function getInitialSharedUrl(): Promise<string | null> {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (!initialUrl) {
      return null;
    }
    return parseSharedUrl(initialUrl);
  } catch (error) {
    console.error('Failed to get initial shared URL:', error);
    return null;
  }
}

/** Alias for getInitialSharedUrl */
export const getInitialShareUrl = getInitialSharedUrl;

/**
 * Subscribes to incoming deep links or shared URLs while the app is running.
 *
 * @param callback Callback function invoked with the extracted URL
 * @returns Unsubscribe function
 */
export function subscribeToSharedUrls(callback: (url: string) => void): () => void {
  const handler = (event: { url: string }) => {
    if (event && event.url) {
      const parsed = parseSharedUrl(event.url);
      if (parsed) {
        callback(parsed);
      }
    }
  };

  const subscription = Linking.addEventListener('url', handler);

  return () => {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    } else if ((Linking as any).removeEventListener) {
      (Linking as any).removeEventListener('url', handler);
    }
  };
}

/** Alias for subscribeToSharedUrls */
export const subscribeToShareIntents = subscribeToSharedUrls;
