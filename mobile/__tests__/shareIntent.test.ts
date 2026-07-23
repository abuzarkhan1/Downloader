import { Linking } from 'react-native';
import {
  extractSharedUrl,
  getInitialShareUrl,
  subscribeToShareIntents,
} from '../src/services/shareIntent';

describe('shareIntent Service', () => {
  describe('extractSharedUrl', () => {
    test('extracts direct http/https URLs', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractSharedUrl(url)).toBe(url);
    });

    test('extracts URL from text containing links', () => {
      const text = 'Check out this video: https://www.tiktok.com/@user/video/1234567890 on TikTok!';
      expect(extractSharedUrl(text)).toBe('https://www.tiktok.com/@user/video/1234567890');
    });

    test('extracts encoded url query param from deep links', () => {
      const deepLink = 'videodownloader://share?url=https%3A%2F%2Fwww.instagram.com%2Fp%2FC1234567890%2F';
      expect(extractSharedUrl(deepLink)).toBe('https://www.instagram.com/p/C1234567890/');
    });

    test('returns null for empty or invalid input', () => {
      expect(extractSharedUrl(null)).toBeNull();
      expect(extractSharedUrl(undefined)).toBeNull();
      expect(extractSharedUrl('')).toBeNull();
      expect(extractSharedUrl('invalid text without url')).toBeNull();
    });
  });

  describe('getInitialShareUrl', () => {
    test('fetches initial URL via Linking.getInitialURL', async () => {
      const spy = jest.spyOn(Linking, 'getInitialURL').mockResolvedValueOnce('https://youtu.be/12345');
      const url = await getInitialShareUrl();
      expect(spy).toHaveBeenCalled();
      expect(url).toBe('https://youtu.be/12345');
      spy.mockRestore();
    });

    test('handles errors gracefully and returns null', async () => {
      const spy = jest.spyOn(Linking, 'getInitialURL').mockRejectedValueOnce(new Error('Linking error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const url = await getInitialShareUrl();
      expect(url).toBeNull();
      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('subscribeToShareIntents', () => {
    test('subscribes to url events and calls callback when URL is received', () => {
      let listenerCallback: ((event: { url: string }) => void) | null = null;
      const removeMock = jest.fn();

      const addEventListenerSpy = jest.spyOn(Linking, 'addEventListener').mockImplementation((type, callback: any) => {
        listenerCallback = callback;
        return { remove: removeMock } as any;
      });

      const callback = jest.fn();
      const unsubscribe = subscribeToShareIntents(callback);

      expect(addEventListenerSpy).toHaveBeenCalledWith('url', expect.any(Function));

      // Simulate incoming URL event
      if (listenerCallback) {
        (listenerCallback as any)({ url: 'https://www.facebook.com/watch/?v=123' });
      }

      expect(callback).toHaveBeenCalledWith('https://www.facebook.com/watch/?v=123');

      // Unsubscribe
      unsubscribe();
      expect(removeMock).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });
  });
});
