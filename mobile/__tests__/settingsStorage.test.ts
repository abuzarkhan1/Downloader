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

  test('resets settings to default values', async () => {
    await saveSettings({ audioCodec: 'OPUS', darkMode: 'oled' });
    const reset = await resetSettings();
    expect(reset.audioCodec).toBe('MP3');
    expect(reset.darkMode).toBe('dark');
  });
});
