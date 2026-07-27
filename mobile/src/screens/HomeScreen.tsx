import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  AppState,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useI18n } from '../i18n/I18nContext';
import { Colors } from '../theme/theme';

interface HomeScreenProps {
  onAnalyze: (url: string, removeWatermark?: boolean) => void;
  onAutoDetectUrl?: (url: string) => void;
  error?: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAnalyze, onAutoDetectUrl, error }) => {
  const { language, setLanguage, t, isRTL } = useI18n();

  // Mode: single vs batch
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Single URL state
  const [urlText, setUrlText] = useState('');
  const [batchText, setBatchText] = useState('');

  // Features
  const [removeWatermark, setRemoveWatermark] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Clipboard auto-detect tracking
  const lastDetectedRef = React.useRef<string | null>(null);

  const checkClipboard = async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content && typeof content === 'string') {
        const trimmed = content.trim();
        if (
          (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
          trimmed !== lastDetectedRef.current
        ) {
          lastDetectedRef.current = trimmed;
          if (onAutoDetectUrl) {
            onAutoDetectUrl(trimmed);
          }
        }
      }
    } catch (e) {
      // Ignore clipboard error
    }
  };

  useEffect(() => {
    checkClipboard();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkClipboard();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        if (isBatchMode) {
          const newText = batchText.trim() ? `${batchText.trim()}\n${text.trim()}` : text.trim();
          setBatchText(newText);
        } else {
          setUrlText(text.trim());
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleAnalyzeClick = () => {
    const target = isBatchMode ? batchText.trim() : urlText.trim();
    if (target && !isAnalyzing) {
      setIsAnalyzing(true);
      onAnalyze(target, removeWatermark);
      setTimeout(() => setIsAnalyzing(false), 2000);
    }
  };

  const currentInputText = isBatchMode ? batchText : urlText;
  const isInputValid = currentInputText.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} testID="home-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons name="lightning-bolt" size={22} color={Colors.white} />
          <Text style={styles.headerAppTitle}>{t('appName')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            testID="language-toggle-btn"
          >
            <Text style={styles.langButtonText}>
              {language === 'en' ? 'اردو' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline Title & Subtitle */}
          <Text style={styles.headlineTitle}>
            {'Download\nAnything.'}
          </Text>


          <View style={styles.spacer28} />

          {/* UrlInputCard */}
          <View style={styles.urlInputCard}>
            <View style={styles.inputCardHeader}>
              <Text style={styles.inputCardLabel}>
                {isBatchMode ? 'URLs — ONE PER LINE' : 'VIDEO URL'}
              </Text>
              <TouchableOpacity
                style={styles.pasteButton}
                onPress={handlePaste}
                activeOpacity={0.7}
              >
                <Ionicons name="clipboard-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.pasteButtonText}>Paste</Text>
              </TouchableOpacity>
            </View>

            {isBatchMode ? (
              <View>
                <TextInput
                  style={styles.batchTextInput}
                  value={batchText}
                  onChangeText={setBatchText}
                  placeholder="Paste multiple URLs here (one per line)..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="home-batch-input"
                />
                {batchText.trim().length > 0 && (
                  <View testID="batch-queue-container" style={{ marginTop: 8, gap: 6 }}>
                    {batchText.split('\n').filter(b => b.trim()).map((line, idx) => (
                      <View key={idx} style={styles.batchQueueRow}>
                        <Text style={styles.batchQueueItemText} numberOfLines={1}>{line}</Text>
                        <TouchableOpacity
                          testID={`remove-batch-item-${idx}`}
                          onPress={() => {
                            const lines = batchText.split('\n').filter(b => b.trim());
                            lines.splice(idx, 1);
                            setBatchText(lines.join('\n'));
                          }}
                        >
                          <Ionicons name="close-circle-outline" size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.singleInputWrapper}>
                <Ionicons name="link-outline" size={18} color={Colors.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.singleTextInput}
                  value={urlText}
                  onChangeText={setUrlText}
                  placeholder="https://..."
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="home-link-input"
                />
                {urlText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setUrlText('')}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {currentInputText.length > 0 && (
              <Text style={styles.charCountText}>
                {currentInputText.length} characters
              </Text>
            )}
          </View>

          <View style={styles.spacer16} />

          {/* Toggle Chips Row */}
          <View style={styles.toggleChipsRow}>
            {/* Chip 1: Single link / Batch mode */}
            <TouchableOpacity
              style={[
                styles.toggleChip,
                isBatchMode ? styles.toggleChipSelected : styles.toggleChipUnselected,
              ]}
              onPress={() => setIsBatchMode(!isBatchMode)}
              activeOpacity={0.8}
              testID="mode-tab-batch"
            >
              <Ionicons
                name={isBatchMode ? 'layers-outline' : 'link-outline'}
                size={16}
                color={isBatchMode ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.toggleChipText, isBatchMode && styles.toggleChipTextSelected]}>
                {isBatchMode ? 'Batch mode' : 'Single link'}
              </Text>
            </TouchableOpacity>

            {/* Chip 2: No watermark */}
            <TouchableOpacity
              style={[
                styles.toggleChip,
                removeWatermark ? styles.toggleChipSelected : styles.toggleChipUnselected,
              ]}
              onPress={() => setRemoveWatermark(!removeWatermark)}
              activeOpacity={0.8}
              testID="home-watermark-switch"
              {...({
                value: removeWatermark,
                onValueChange: (val: boolean) => setRemoveWatermark(val),
              } as any)}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={removeWatermark ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.toggleChipText, removeWatermark && styles.toggleChipTextSelected]}>
                No watermark
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spacer24} />

          {/* Analyze Button */}
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              isInputValid && !isAnalyzing
                ? styles.analyzeButtonEnabled
                : styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyzeClick}
            disabled={!isInputValid || isAnalyzing}
            activeOpacity={0.85}
            testID="home-submit-btn"
          >
            {isAnalyzing ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator size="small" color={Colors.black} />
                <Text style={styles.analyzeButtonTextEnabled}>Analyzing…</Text>
              </View>
            ) : (
              <View style={styles.buttonContentRow}>
                <Ionicons
                  name="search"
                  size={18}
                  color={isInputValid ? Colors.black : Colors.textTertiary}
                />
                <Text style={isInputValid ? styles.analyzeButtonTextEnabled : styles.analyzeButtonTextDisabled}>
                  Analyze Link
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Error message box */}
          {error && (
            <View style={styles.errorBox} testID="home-error-banner">
              <Ionicons name="warning-outline" size={18} color={Colors.errorRed} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.spacer32} />

          {/* Supported Platforms Footer */}
          <Text style={styles.platformsHeader}>SUPPORTED PLATFORMS</Text>
          <View style={styles.platformsRow}>
            {['YouTube', 'TikTok', 'Instagram', 'Twitter', 'Facebook'].map((platform) => (
              <View key={platform} style={styles.platformBadge}>
                <Text style={styles.platformBadgeText}>{platform}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.black,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dividerColor,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerAppTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.black80,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clipboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black80,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dividerColor,
  },
  clipboardTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  clipboardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  clipboardUrl: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  clipboardActionBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clipboardActionText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '700',
  },
  clipboardDismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 100, // Safe padding for iPhone floating navbar
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  headlineTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: 6,
  },
  headlineSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.1,
  },
  spacer16: { height: 16 },
  spacer24: { height: 24 },
  spacer28: { height: 28 },
  spacer32: { height: 32 },
  urlInputCard: {
    backgroundColor: Colors.black80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    padding: 16,
    gap: 10,
  },
  inputCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pasteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  singleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    paddingHorizontal: 12,
  },
  singleTextInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  batchTextInput: {
    backgroundColor: Colors.black70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  batchQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.black70,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  batchQueueItemText: {
    color: Colors.textSecondary,
    fontSize: 11,
    flex: 1,
    marginRight: 8,
  },
  clearBtn: {
    padding: 6,
  },
  charCountText: {
    fontSize: 11,
    color: Colors.textTertiary,
    alignSelf: 'flex-end',
  },
  toggleChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleChipSelected: {
    backgroundColor: Colors.black60,
    borderWidth: 1,
    borderColor: Colors.dividerLight,
  },
  toggleChipUnselected: {
    backgroundColor: Colors.black80,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  toggleChipText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  toggleChipTextSelected: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  analyzeButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonEnabled: {
    backgroundColor: Colors.white,
  },
  analyzeButtonDisabled: {
    backgroundColor: Colors.black70,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzeButtonTextEnabled: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
  analyzeButtonTextDisabled: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 1,
    borderColor: Colors.errorRed,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: Colors.errorRed,
    fontSize: 13,
    lineHeight: 18,
  },
  platformsHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  platformsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  platformBadge: {
    backgroundColor: Colors.black80,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  platformBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
