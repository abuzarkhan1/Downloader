import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  Platform as RNPlatform,
} from 'react-native';
import { AudioCodec } from '../types';

interface HomeScreenProps {
  onAnalyze: (url: string) => void;
  error?: string | null;
  onNavigate?: (screen: 'History' | 'Templates' | 'Settings') => void;
}

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAnalyze, error, onNavigate }) => {
  const [url, setUrl] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Quick settings toggles on Home
  const [sponsorBlock, setSponsorBlock] = useState(true);
  const [subtitles, setSubtitles] = useState(false);
  const [preferredCodec, setPreferredCodec] = useState<AudioCodec>('MP3');

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setInputError('Please enter a media URL');
      return;
    }
    setInputError(null);
    onAnalyze(trimmed);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* Top Header Navigation */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <Text style={styles.headerTitle}>Seal Video Downloader</Text>
        </View>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>MD3 v1.0</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Seal Media Extractor</Text>
            <Text style={styles.heroSubtitle}>
              Universal video downloader & audio extractor powered by yt-dlp.
            </Text>
          </View>

          {/* Supported Platforms */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderLabel}>SUPPORTED PLATFORMS</Text>
            <View style={styles.platformRow}>
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.ytDot]} />
                <Text style={styles.platformTagText}>YouTube</Text>
              </View>
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.ttDot]} />
                <Text style={styles.platformTagText}>TikTok</Text>
              </View>
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.igDot]} />
                <Text style={styles.platformTagText}>Instagram</Text>
              </View>
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.fbDot]} />
                <Text style={styles.platformTagText}>Facebook</Text>
              </View>
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.twDot]} />
                <Text style={styles.platformTagText}>X (Twitter)</Text>
              </View>
            </View>
          </View>

          {/* Input Card */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>MEDIA URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Paste video or audio link here..."
                placeholderTextColor="#8C8D82"
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  if (inputError) setInputError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                testID="home-link-input"
              />
              {url.length > 0 && (
                <TouchableOpacity
                  onPress={() => setUrl('')}
                  style={styles.clearIconButton}
                  testID="home-clear-btn"
                >
                  <Text style={styles.clearIconText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {(inputError || error) && (
              <View style={styles.errorAlertBox} testID="home-error-banner">
                <Text style={styles.errorAlertIcon}>⚠️</Text>
                <Text style={styles.errorAlertText}>{inputError || error}</Text>
              </View>
            )}

            {/* Quick Extraction Toggles */}
            <View style={styles.quickOptionsCard}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextGroup}>
                  <Text style={styles.toggleTitle}>SponsorBlock</Text>
                  <Text style={styles.toggleSub}>Auto-remove sponsor segments</Text>
                </View>
                <Switch
                  value={sponsorBlock}
                  onValueChange={setSponsorBlock}
                  trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
                  thumbColor={sponsorBlock ? DARK_BG : SUBTEXT_COLOR}
                  testID="home-sponsorblock-switch"
                />
              </View>

              <View style={[styles.toggleRow, styles.topBorder]}>
                <View style={styles.toggleTextGroup}>
                  <Text style={styles.toggleTitle}>Embed Subtitles</Text>
                  <Text style={styles.toggleSub}>Download & embed subtitles</Text>
                </View>
                <Switch
                  value={subtitles}
                  onValueChange={setSubtitles}
                  trackColor={{ false: SURFACE_BG, true: LIME_ACCENT }}
                  thumbColor={subtitles ? DARK_BG : SUBTEXT_COLOR}
                  testID="home-subtitles-switch"
                />
              </View>

              <View style={[styles.codecRow, styles.topBorder]}>
                <Text style={styles.toggleTitle}>Audio Codec</Text>
                <View style={styles.codecPills}>
                  {(['MP3', 'M4A', 'FLAC', 'OPUS'] as AudioCodec[]).map((codec) => (
                    <TouchableOpacity
                      key={codec}
                      style={[
                        styles.codeChip,
                        preferredCodec === codec && styles.codeChipActive,
                      ]}
                      onPress={() => setPreferredCodec(codec)}
                      activeOpacity={0.8}
                      testID={`home-codec-${codec}`}
                    >
                      <Text
                        style={[
                          styles.codeChipText,
                          preferredCodec === codec && styles.codeChipTextActive,
                        ]}
                      >
                        {codec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleSubmit}
              activeOpacity={0.85}
              testID="home-submit-btn"
            >
              <Text style={styles.analyzeButtonText}>Analyze & Download</Text>
              <Text style={styles.analyzeButtonIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  keyboardView: {
    flex: 1,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_COLOR,
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionText: {
    color: LIME_ACCENT,
    fontSize: 11,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_COLOR,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: SUBTEXT_COLOR,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  platformRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ytDot: {
    backgroundColor: '#FF5252',
  },
  ttDot: {
    backgroundColor: '#22D3EE',
  },
  igDot: {
    backgroundColor: '#F472B6',
  },
  fbDot: {
    backgroundColor: '#1877F2',
  },
  twDot: {
    backgroundColor: '#FFFFFF',
  },
  platformTagText: {
    color: TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: TEXT_COLOR,
    fontSize: 14,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clearIconButton: {
    padding: 6,
  },
  clearIconText: {
    color: SUBTEXT_COLOR,
    fontSize: 13,
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorAlertIcon: {
    fontSize: 15,
  },
  errorAlertText: {
    flex: 1,
    color: '#FF5252',
    fontSize: 13,
    lineHeight: 18,
  },
  quickOptionsCard: {
    backgroundColor: SURFACE_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleTitle: {
    color: TEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    color: SUBTEXT_COLOR,
    fontSize: 11,
  },
  topBorder: {
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 8,
    marginTop: 8,
  },
  codecRow: {
    flexDirection: 'column',
    gap: 6,
  },
  codecPills: {
    flexDirection: 'row',
    gap: 6,
  },
  codeChip: {
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeChipActive: {
    backgroundColor: LIME_ACCENT,
    borderColor: LIME_ACCENT,
  },
  codeChipText: {
    color: SUBTEXT_COLOR,
    fontSize: 11,
    fontWeight: '600',
  },
  codeChipTextActive: {
    color: DARK_BG,
    fontWeight: '700',
  },
  analyzeButton: {
    backgroundColor: LIME_ACCENT,
    borderRadius: 10,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: LIME_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonText: {
    color: DARK_BG,
    fontSize: 14,
    fontWeight: '700',
  },
  analyzeButtonIcon: {
    color: DARK_BG,
    fontSize: 16,
    fontWeight: '700',
  },
});
