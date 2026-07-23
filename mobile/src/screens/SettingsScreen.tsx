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
  Modal,
  Platform as RNPlatform,
} from 'react-native';
import { UserSettings, AudioCodec, AudioBitrate, DarkModeVariant } from '../types';
import {
  getSettings,
  saveSettings,
  resetSettings,
  DEFAULT_USER_SETTINGS,
} from '../services/settingsStorage';
import { clearHistory } from '../services/historyStorage';

interface SettingsScreenProps {
  onSettingsChanged?: (settings: UserSettings) => void;
}

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const OLED_BG = '#000000';
const DIM_BG = '#141512';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onSettingsChanged,
}) => {
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [dirInput, setDirInput] = useState('/Downloads/Seal');
  const [cookiesInput, setCookiesInput] = useState('');
  const [proxyInput, setProxyInput] = useState('');
  const [langModalVisible, setLangModalVisible] = useState(false);

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettingsState(s);
      setDirInput(s.downloadDirectory || '/Downloads/Seal');
      setCookiesInput(s.cookiesStr || '');
      setProxyInput(s.proxyUrl || '');
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
    setCookiesInput(defaultSet.cookiesStr || '');
    setProxyInput(defaultSet.proxyUrl || '');
    if (onSettingsChanged) onSettingsChanged(defaultSet);
    Alert.alert('Settings Reset', 'Preferences have been restored to defaults.');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    Alert.alert('History Cleared', 'Download history has been completely wiped.');
  };

  const currentBg =
    settings.darkMode === 'oled'
      ? OLED_BG
      : settings.darkMode === 'dim'
      ? DIM_BG
      : DARK_BG;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentBg }]} testID="settings-screen">
      <StatusBar barStyle="light-content" backgroundColor={currentBg} />

      {/* Navigation Header */}
      <View style={[styles.headerBar, { backgroundColor: currentBg }]}>
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

        {/* Category 3: Cookie Profile & Auth Manager */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTag}>COOKIE PROFILE & AUTHENTICATION</Text>
          <Text style={styles.settingTitle}>Netscape Cookies.txt</Text>
          <Text style={styles.settingDesc}>
            Paste cookies.txt string for private Instagram/YouTube downloads
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={cookiesInput}
              onChangeText={setCookiesInput}
              onEndEditing={() => updateSetting('cookiesStr', cookiesInput)}
              placeholder="Paste Netscape cookies.txt content here..."
              placeholderTextColor="#8C8D82"
              multiline
              numberOfLines={4}
              autoCapitalize="none"
              autoCorrect={false}
              testID="setting-cookies-input"
            />
          </View>
        </View>

        {/* Category 4: Directory */}
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

        {/* Category 5: Format & Audio Codec */}
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

          {/* MKV vs MP4 Toggle */}
          <View style={[styles.settingRow, styles.topSpacing]}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Prefer MKV Container</Text>
              <Text style={styles.settingDesc}>Remux video into MKV container instead of MP4</Text>
            </View>
            <Switch
              value={!!settings.remuxMkv}
              onValueChange={(val) => updateSetting('remuxMkv', val)}
              trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
              thumbColor={settings.remuxMkv ? DARK_BG : SUBTEXT_COLOR}
              testID="setting-remux-mkv-switch"
            />
          </View>

          {/* Square Artwork Crop Toggle */}
          <View style={[styles.settingRow, styles.topSpacing]}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Square Artwork Crop</Text>
              <Text style={styles.settingDesc}>Crop audio cover thumbnails to 1:1 ratio for MP3/FLAC</Text>
            </View>
            <Switch
              value={!!settings.cropArtwork}
              onValueChange={(val) => updateSetting('cropArtwork', val)}
              trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
              thumbColor={settings.cropArtwork ? DARK_BG : SUBTEXT_COLOR}
              testID="setting-crop-artwork-switch"
            />
          </View>

          {/* Embed Subtitles Toggle */}
          <View style={[styles.settingRow, styles.topSpacing]}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Embed Subtitles</Text>
              <Text style={styles.settingDesc}>Extract and embed subtitles into video container</Text>
            </View>
            <Switch
              value={!!settings.embedSubtitles || !!settings.subtitles}
              onValueChange={(val) => {
                updateSetting('embedSubtitles', val);
                updateSetting('subtitles', val);
              }}
              trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
              thumbColor={(settings.embedSubtitles || settings.subtitles) ? DARK_BG : SUBTEXT_COLOR}
              testID="setting-subtitles-switch"
            />
          </View>

          {/* Subtitle Language Selector */}
          <Text style={[styles.settingTitle, styles.topSpacing]}>Subtitle Language</Text>
          <Text style={styles.settingDesc}>Choose preferred subtitle language format</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={styles.selectModalButton}
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.8}
              testID="setting-subtitle-lang-btn"
            >
              <Text style={styles.selectModalButtonText}>
                Language: {(settings.subtitleLang || 'en').toUpperCase()} ▼
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={langModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setLangModalVisible(false)}
            testID="subtitle-lang-modal"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Subtitle Language</Text>
                {[
                  { label: 'English', value: 'en' },
                  { label: 'Spanish', value: 'es' },
                  { label: 'Auto Detect', value: 'auto' },
                  { label: 'All Languages', value: 'all' },
                ].map((item) => {
                  const isSelected = (settings.subtitleLang || 'en') === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                      onPress={() => {
                        updateSetting('subtitleLang', item.value);
                        setLangModalVisible(false);
                      }}
                      testID={`subtitle-lang-option-${item.value}`}
                    >
                      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                        {item.label} ({item.value})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setLangModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* Category 6: Network & SponsorBlock */}
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

          <Text style={[styles.settingTitle, styles.topSpacing]}>Network Proxy URL</Text>
          <Text style={styles.settingDesc}>Route requests through HTTP or SOCKS5 proxy server</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={proxyInput}
              onChangeText={setProxyInput}
              onEndEditing={() => updateSetting('proxyUrl', proxyInput.trim())}
              placeholder="e.g. http://127.0.0.1:8080"
              placeholderTextColor="#8C8D82"
              autoCapitalize="none"
              autoCorrect={false}
              testID="setting-proxy-input"
            />
          </View>
        </View>

        {/* Category 7: Troubleshooting */}
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

        {/* Category 8: About */}
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
  selectModalButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectModalButtonText: {
    color: LIME_ACCENT,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  multilineInput: {
    height: 80,
    paddingVertical: 10,
    textAlignVertical: 'top',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginBottom: 16,
  },
  modalOption: {
    backgroundColor: SURFACE_BG,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  modalOptionSelected: {
    backgroundColor: LIME_ACCENT,
    borderColor: LIME_ACCENT,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  modalOptionTextSelected: {
    color: DARK_BG,
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: SURFACE_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  modalCloseButtonText: {
    color: SUBTEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
});
