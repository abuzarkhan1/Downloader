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
  Platform as RNPlatform,
} from 'react-native';

interface HomeScreenProps {
  onAnalyze: (url: string) => void;
  error?: string | null;
}

// oklch(0.66 0.16 252) -> Electric Royal Blue #0B4DDE
const PRIMARY_COLOR = '#0B4DDE';

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAnalyze, error }) => {
  const [url, setUrl] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

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
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Top Header Navigation */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <Text style={styles.headerTitle}>Media Downloader</Text>
        </View>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v1.0</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Universal Media Downloader</Text>
            <Text style={styles.heroSubtitle}>
              Analyze and extract high-definition video formats or audio files for offline archiving.
            </Text>
          </View>

          {/* Supported Platforms */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderLabel}>SUPPORTED PLATFORMS</Text>
            <View style={styles.platformRow}>
              {/* YouTube Tag */}
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.ytDot]} />
                <Text style={styles.platformTagText}>YouTube</Text>
              </View>

              {/* TikTok Tag */}
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.ttDot]} />
                <Text style={styles.platformTagText}>TikTok</Text>
              </View>

              {/* Instagram Tag */}
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.igDot]} />
                <Text style={styles.platformTagText}>Instagram</Text>
              </View>

              {/* Facebook Tag */}
              <View style={styles.platformTag}>
                <View style={[styles.dot, styles.fbDot]} />
                <Text style={styles.platformTagText}>Facebook</Text>
              </View>
            </View>
          </View>

          {/* Clean Enterprise Input Card */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Media URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Paste media link here..."
                placeholderTextColor="#666670"
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

            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleSubmit}
              activeOpacity={0.85}
              testID="home-submit-btn"
            >
              <Text style={styles.analyzeButtonText}>Analyze Link</Text>
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
    backgroundColor: '#09090B',
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
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: '#19191E',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FAFAFA',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
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
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272A',
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
  platformTagText: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#121215',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: '#FAFAFA',
    fontSize: 14,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clearIconButton: {
    padding: 6,
  },
  clearIconText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
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
  analyzeButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
