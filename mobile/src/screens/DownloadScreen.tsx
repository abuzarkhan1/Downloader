import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform as RNPlatform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { DownloadStatusResponse } from '../types';
import { getDownloadStatus, downloadAndSaveMedia } from '../services/api';
import { CustomErrorModal } from '../components/CustomErrorModal';
import { useI18n } from '../i18n/I18nContext';
import { Colors } from '../theme/theme';

interface DownloadScreenProps {
  downloadJobId?: string | null;
  statusData?: DownloadStatusResponse;
  selectedQuality?: string;
  formatType?: 'video' | 'audio';
  title?: string;
  onDone?: () => void;
  onCancel?: () => void;
  onDownloadAnother?: () => void;
}

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  downloadJobId,
  statusData: initialStatusData,
  selectedQuality = '1080p',
  formatType = 'video',
  title = 'Media Content',
  onDone,
  onCancel,
  onDownloadAnother,
}) => {
  const { t, isRTL } = useI18n();

  const [currentStatus, setCurrentStatus] = useState<DownloadStatusResponse>(
    initialStatusData || { status: 'processing', progress_percent: 0 }
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(
    initialStatusData?.error_message || null
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('File Ready');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (initialStatusData) {
      setCurrentStatus(initialStatusData);
      if (initialStatusData.error_message) {
        setErrorMsg(initialStatusData.error_message);
      }
    }
  }, [initialStatusData]);

  useEffect(() => {
    if (!downloadJobId) return;

    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await getDownloadStatus(downloadJobId);
        setCurrentStatus(prev => ({
          ...res,
          local_uri: prev.local_uri || res.local_uri,
        }));

        if (res.status === 'ready' || res.status === 'failed') {
          if (res.status === 'failed') {
            setErrorMsg((res as any).message || res.error_message || 'Download failed. Please try again.');
          }
          return;
        }
      } catch (err: any) {
        console.warn('Poll error:', err);
      }

      timer = setTimeout(poll, 1000);
    };

    poll();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [downloadJobId]);

  const handleBack = () => {
    if (onDone) onDone();
    if (onCancel) onCancel();
    if (onDownloadAnother) onDownloadAnother();
  };

  const isDownloading = currentStatus.status === 'processing' || currentStatus.status === 'queued';
  const isComplete = currentStatus.status === 'ready';
  const isFailed = currentStatus.status === 'failed';

  const fileUrl = currentStatus.local_uri || currentStatus.file_url;

  const getMimeType = (urlStr: string) => {
    const lower = urlStr.toLowerCase();
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.srt') || lower.endsWith('.vtt') || lower.endsWith('.txt')) return 'text/plain';
    return formatType === 'audio' ? 'audio/*' : 'video/*';
  };

  const handleOpen = async () => {
    if (!fileUrl) return;
    try {
      let targetPath = fileUrl;

      // If HTTP URL, download to local device storage first
      if (targetPath.startsWith('http')) {
        const ext = formatType === 'audio' ? 'mp3' : 'mp4';
        const filename = `${title.replace(/[^a-zA-Z0-9._-]/g, '_')}_${selectedQuality}.${ext}`;
        targetPath = await downloadAndSaveMedia(targetPath, filename);
      }

      if (RNPlatform.OS === 'android') {
        let contentUri = targetPath;
        if (targetPath.startsWith('file://')) {
          try {
            contentUri = await FileSystem.getContentUriAsync(targetPath);
          } catch (e) {
            console.warn('getContentUriAsync fallback:', e);
          }
        }
        const mimeType = getMimeType(targetPath);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } else {
        const supported = await Linking.canOpenURL(targetPath);
        if (supported) {
          await Linking.openURL(targetPath);
        } else {
          setModalTitle('File Saved');
          setModalMessage(`Your media file is ready at:\n${targetPath}`);
          setModalVisible(true);
        }
      }
    } catch (err: any) {
      console.warn('Open error:', err);
      Linking.openURL(fileUrl).catch(() => {
        setModalTitle('File Location');
        setModalMessage(`Your media file location:\n${fileUrl}`);
        setModalVisible(true);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="download-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      <CustomErrorModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onDismiss={() => setModalVisible(false)}
      />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('appName')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.card}>
          {/* Status Header */}
          <View style={[styles.statusHeaderRow, isRTL && styles.alignEnd]}>
            {isDownloading && (
              <View style={[styles.statusBadge, styles.statusBadgeDownloading]}>
                <Ionicons name="sync" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                <Text style={styles.statusBadgeTextDownloading}>Processing</Text>
              </View>
            )}
            {isComplete && (
              <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.successGreen} style={{ marginRight: 4 }} />
                <Text style={styles.statusBadgeTextSuccess}>Ready</Text>
              </View>
            )}
            {isFailed && (
              <View style={[styles.statusBadge, styles.statusBadgeFailed]}>
                <Ionicons name="alert-circle" size={14} color={Colors.errorRed} style={{ marginRight: 4 }} />
                <Text style={styles.statusBadgeTextFailed}>Failed</Text>
              </View>
            )}
          </View>

          <Text style={[styles.statusTitle, isRTL && styles.textRight]}>
            {isDownloading && t('downloadingMedia')}
            {isComplete && t('downloadComplete')}
            {isFailed && t('downloadFailed')}
          </Text>

          <Text style={[styles.statusSubtext, isRTL && styles.textRight]} numberOfLines={2}>
            {isDownloading && `${t('downloadingMedia')} ${title} (${selectedQuality})...`}
            {isComplete && `${t('fileSavedToGallery')}`}
            {isFailed && (errorMsg || 'An error occurred during extraction.')}
          </Text>

          {/* Progress Card Section */}
          {isDownloading && (
            <View style={styles.progressContainer} testID="progress-card">
              <View style={[styles.progressHeaderRow, isRTL && styles.rowReverse]}>
                <Text style={styles.progressLabel}>{t('preparingDownload')}</Text>
                <Text style={styles.progressPercentText} testID="progress-percent">
                  {currentStatus.progress_percent}%
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(5, currentStatus.progress_percent)}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Ready State Actions */}
          {isComplete && (
            <View style={styles.actionRow} testID="download-completion-actions">
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleOpen}
                activeOpacity={0.85}
                testID="btn-open-file"
              >
                <Ionicons name="folder-open-outline" size={18} color={Colors.black} style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Open File</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
                activeOpacity={0.8}
                testID="done-btn"
              >
                <Text style={styles.secondaryButtonText}>{t('newSearch')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Failed / Downloading Actions */}
          {!isComplete && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleBack}
                activeOpacity={0.8}
                testID={isFailed ? "btn-retry-home" : "done-btn"}
              >
                <Text style={styles.cancelButtonText}>
                  {isDownloading ? t('cancelDownload') : t('newSearch')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.black,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dividerColor,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 100,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: Colors.black80,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
  },
  statusHeaderRow: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusBadgeDownloading: {
    backgroundColor: Colors.black60,
    borderColor: Colors.dividerLight,
  },
  statusBadgeTextDownloading: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: Colors.successGreen,
  },
  statusBadgeTextSuccess: {
    color: Colors.successGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeFailed: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: Colors.errorRed,
  },
  statusBadgeTextFailed: {
    color: Colors.errorRed,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  statusSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercentText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.black70,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.black70,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.black70,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.errorRed,
    fontSize: 14,
    fontWeight: '600',
  },
});
