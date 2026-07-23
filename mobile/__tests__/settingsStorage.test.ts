import {
  getSettings,
  saveSettings,
  resetSettings,
  DEFAULT_USER_SETTINGS,
} from '../src/services/settingsStorage';

describe('User Settings Storage Service', () => {
  beforeEach(async () => {
    await resetSettings();
  });

  test('retrieves default user settings', async () => {
    const settings = await getSettings();
    expect(settings.defaultQuality).toBe('1080p');
    expect(settings.audioCodec).toBe('MP3');
    expect(settings.sponsorBlock).toBe(true);
    expect(settings.subtitles).toBe(false);
  });

  test('saves partial settings correctly', async () => {
    const updated = await saveSettings({
      audioCodec: 'FLAC',
      sponsorBlock: false,
      subtitles: true,
    });

    expect(updated.audioCodec).toBe('FLAC');
    expect(updated.sponsorBlock).toBe(false);
    expect(updated.subtitles).toBe(true);
    expect(updated.defaultQuality).toBe('1080p'); // Unchanged

    const reloaded = await getSettings();
    expect(reloaded.audioCodec).toBe('FLAC');
  });

  test('stores and retrieves new mobile parity preferences correctly', async () => {
    const updated = await saveSettings({
      remuxMkv: true,
      cropArtwork: true,
      embedSubtitles: true,
      cookiesStr: '# Netscape HTTP Cookie File\n.youtube.com TRUE / FALSE 123456 session_id xyz',
      proxyUrl: 'http://127.0.0.1:8080',
      subtitleLang: 'es',
      darkMode: 'oled',
      maxFilesize: '500M',
      rateLimit: '2M',
      restrictFilenames: true,
      forceIpv4: true,
      outputTemplate: '%(uploader)s - %(title)s.%(ext)s',
    });

    expect(updated.remuxMkv).toBe(true);
    expect(updated.cropArtwork).toBe(true);
    expect(updated.embedSubtitles).toBe(true);
    expect(updated.cookiesStr).toContain('session_id xyz');
    expect(updated.proxyUrl).toBe('http://127.0.0.1:8080');
    expect(updated.subtitleLang).toBe('es');
    expect(updated.darkMode).toBe('oled');
    expect(updated.maxFilesize).toBe('500M');
    expect(updated.rateLimit).toBe('2M');
    expect(updated.restrictFilenames).toBe(true);
    expect(updated.forceIpv4).toBe(true);
    expect(updated.outputTemplate).toBe('%(uploader)s - %(title)s.%(ext)s');

    const reloaded = await getSettings();
    expect(reloaded.remuxMkv).toBe(true);
    expect(reloaded.proxyUrl).toBe('http://127.0.0.1:8080');
    expect(reloaded.maxFilesize).toBe('500M');
    expect(reloaded.rateLimit).toBe('2M');
    expect(reloaded.restrictFilenames).toBe(true);
    expect(reloaded.forceIpv4).toBe(true);
    expect(reloaded.outputTemplate).toBe('%(uploader)s - %(title)s.%(ext)s');
  });

  test('resets settings to default values', async () => {
    await saveSettings({
      audioCodec: 'OPUS',
      darkMode: 'oled',
      remuxMkv: true,
      maxFilesize: '500M',
      restrictFilenames: true,
    });
    const reset = await resetSettings();
    expect(reset.audioCodec).toBe('MP3');
    expect(reset.darkMode).toBe('dark');
    expect(reset.remuxMkv).toBe(false);
    expect(reset.maxFilesize).toBe('');
    expect(reset.restrictFilenames).toBe(false);
  });
});
