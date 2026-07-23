import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SettingsScreen } from '../src/screens/SettingsScreen';

describe('SettingsScreen Component', () => {
  test('renders settings screen with preferences categories without crashing', async () => {
    let tree: any;

    await act(async () => {
      tree = renderer.create(<SettingsScreen />);
    });

    const instance = tree.root;
    const screen = instance.findByProps({ testID: 'settings-screen' });
    expect(screen).toBeTruthy();

    const qualitySetting = instance.findByProps({ testID: 'setting-default-quality' });
    expect(qualitySetting).toBeTruthy();

    const codecSetting = instance.findByProps({ testID: 'setting-audio-codec' });
    expect(codecSetting).toBeTruthy();

    const sponsorBlockSwitch = instance.findByProps({ testID: 'setting-sponsorblock-switch' });
    expect(sponsorBlockSwitch).toBeTruthy();

    const cookiesInput = instance.findByProps({ testID: 'setting-cookies-input' });
    expect(cookiesInput).toBeTruthy();

    const remuxMkvSwitch = instance.findByProps({ testID: 'setting-remux-mkv-switch' });
    expect(remuxMkvSwitch).toBeTruthy();

    const cropArtworkSwitch = instance.findByProps({ testID: 'setting-crop-artwork-switch' });
    expect(cropArtworkSwitch).toBeTruthy();

    const subtitleLangBtn = instance.findByProps({ testID: 'setting-subtitle-lang-btn' });
    expect(subtitleLangBtn).toBeTruthy();

    const proxyInput = instance.findByProps({ testID: 'setting-proxy-input' });
    expect(proxyInput).toBeTruthy();
  });
});
