import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Platform as RNPlatform,
} from 'react-native';
import { UserSettings, AudioCodec, AudioBitrate, DarkModeVariant } from '../types';
import {
  getSettings,
  saveSettings,
  resetSettings,
} from '../services/settingsStorage';
import { clearHistory } from '../services/historyStorage';

interface SettingsScreenProps {
  onSettingsChanged?: (settings: UserSettings) => void;
}

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onSettingsChanged,
}) => {
  const [settings, setSettingsState] = useState<UserSettings>({
    defaultQuality: '1080p',
    audioCodec: 'MP3',
    audioBitrate: '320k',
    sponsorBlock: true,
    subtitles: false,
    darkMode: 'dark',
    autoDownloadClipboard: false,
    downloadDirectory: '/Downloads/Seal',
  });

  const [dirInput, setDirInput] = useState('/Downloads/Seal');

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettingsState(s);
      setDirInput(s.downloadDirectory);
    }
    load();
  }, []);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const updated = await saveSettings({ [key]: value });
    setSettingsState(updated);
    if (onSettingsChanged) onSettingsChanged(updated);
  };

  const handleReset = async () => {
    const defaultSet = await resetSettings();
    setSettingsState(defaultSet);
    setDirInput(defaultSet.downloadDirectory);
    if (onSettingsChanged) onSettingsChanged(defaultSet);
    Alert.alert('Settings Reset', 'Preferences have been restored to defaults.');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    Alert.alert('History Cleared', 'Download history has been completely wiped.');
  };

  return (
    <SafeAreaView style={styles.container} testID="settings-screen">
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Navigation Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Seal Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category 1: General */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>GENERAL</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Auto-detect Clipboard Link</Text>
              <Text style={styles.settingDesc}>Prompt analysis when a media URL is copied to clipboard</Text>
            </View>
            <Switch
              value={settings.autoDownloadClipboard}
              onValueChange={(val) => updateSetting('autoDownloadClipboard', val)}
              trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
              thumbColor={settings.autoDownloadClipboard ? DARK_BG : SUBTEXT_COLOR}
              testID="setting-autodownload-switch"
            />
          </View>
        </View>

        {/* Category 2: Appearance */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>APPEARANCE</Text>
          <Text style={styles.settingTitle}>Dark Mode Style</Text>
          <Text style={styles.settingDesc}>Choose your preferred Seal MD3 surface tone</Text>
          <View style={styles.optionRow} testID="setting-darkmode">
            {(['dark', 'dim', 'oled'] as DarkModeVariant[]).map((variant) => {
              const isSelected = settings.darkMode === variant;
              return (
                <TouchableOpacity
                  key={variant}
                  style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                  onPress={() => updateSetting('darkMode', variant)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {variant.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category 3: Directory */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>DIRECTORY & STORAGE</Text>
          <Text style={styles.settingTitle}>Download Directory Path</Text>
          <Text style={styles.settingDesc}>Local storage folder for saved media items</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={dirInput}
              onChangeText={setDirInput}
              onEndEditing={() => updateSetting('downloadDirectory', dirInput.trim() || '/Downloads/Seal')}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Category 4: Format & Audio Codec */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>FORMAT & CODEC PREFERENCES</Text>
          
          <Text style={styles.settingTitle}>Default Video Quality</Text>
          <View style={styles.optionRow} testID="setting-default-quality">
            {['1080p', '720p', '480p', 'best'].map((q) => {
              const isSelected = settings.defaultQuality === q;
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                  onPress={() => updateSetting('defaultQuality', q)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {q}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.settingTitle, styles.topSpacing]}>Audio Extraction Codec</Text>
          <View style={styles.optionRow} testID="setting-audio-codec">
            {(['MP3', 'M4A', 'FLAC', 'OPUS'] as AudioCodec[]).map((codec) => {
              const isSelected = settings.audioCodec === codec;
              return (
                <TouchableOpacity
                  key={codec}
                  style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                  onPress={() => updateSetting('audioCodec', codec)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {codec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.settingTitle, styles.topSpacing]}>Audio Bitrate</Text>
          <View style={styles.optionRow} testID="setting-audio-bitrate">
            {(['128k', '192k', '320k'] as AudioBitrate[]).map((br) => {
              const isSelected = settings.audioBitrate === br;
              return (
                <TouchableOpacity
                  key={br}
                  style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                  onPress={() => updateSetting('audioBitrate', br)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {br}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.settingRow, styles.topSpacing]}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Embed Subtitles</Text>
              <Text style={styles.settingDesc}>Extract and embed subtitles in video container</Text>
            </View>
            <Switch
              value={settings.subtitles}
              onValueChange={(val) => updateSetting('subtitles', val)}
              trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
              thumbColor={settings.subtitles ? DARK_BG : SUBTEXT_COLOR}
              testID="setting-subtitles-switch"
            />
          </View>
        </View>

        {/* Category 5: Network & SponsorBlock */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>NETWORK & SPONSORBLOCK</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>SponsorBlock Auto-Removal</Text>
              <Text style={styles.settingDesc}>Skip sponsored segments using SponsorBlock API</Text>
            </View>
            <Switch
              value={settings.sponsorBlock}
              onValueChange={(val) => updateSetting('sponsorBlock', val)}
              trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
              thumbColor={settings.sponsorBlock ? DARK_BG : SUBTEXT_COLOR}
              testID="setting-sponsorblock-switch"
            />
          </View>
        </View>

        {/* Category 6: Troubleshooting */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>TROUBLESHOOTING & DANGER ZONE</Text>
          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearHistory}
              activeOpacity={0.8}
            >
              <Text style={styles.dangerButtonText}>Clear Download History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReset}
              activeOpacity={0.8}
              testID="reset-settings-btn"
            >
              <Text style={styles.secondaryButtonText}>Reset All Settings to Defaults</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category 7: About */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>ABOUT</Text>
          <Text style={styles.aboutTitle}>Seal Media Downloader (MD3)</Text>
          <Text style={styles.aboutVersion}>v1.0.0 • Powered by yt-dlp</Text>
          <Text style={styles.aboutDesc}>
            Open-source universal video & audio downloader built with React Native and modern Material Design 3 guidelines.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: DARK_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_COLOR,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  categoryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 16,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: SUBTEXT_COLOR,
    lineHeight: 16,
  },
  topSpacing: {
    marginTop: 14,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  chipButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipButtonSelected: {
    backgroundColor: LIME_ACCENT,
    borderColor: LIME_ACCENT,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: SUBTEXT_COLOR,
  },
  chipTextSelected: {
    color: DARK_BG,
    fontWeight: '700',
  },
  inputRow: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    height: 42,
    paddingHorizontal: 12,
    color: TEXT_COLOR,
    fontSize: 13,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonStack: {
    gap: 10,
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: TEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  aboutVersion: {
    fontSize: 12,
    color: LIME_ACCENT,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 6,
  },
  aboutDesc: {
    fontSize: 12,
    color: SUBTEXT_COLOR,
    lineHeight: 18,
  },
});
