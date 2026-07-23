import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform as RNPlatform,
  Linking,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { DownloadStatusResponse } from '../types';
import { getDownloadStatus } from '../services/api';
import { saveHistoryItem } from '../services/historyStorage';
import { CustomErrorModal } from '../components/CustomErrorModal';

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

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

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
      if (initialStatusData.status === 'ready' || initialStatusData.status === 'failed') {
        saveToHistory(initialStatusData);
      }
    }
  }, [initialStatusData]);

  const saveToHistory = async (statusRes: DownloadStatusResponse) => {
    try {
      await saveHistoryItem({
        id: downloadJobId || `job_${Date.now()}`,
        title: title,
        quality: selectedQuality,
        format: formatType,
        filePath: statusRes.file_url || statusRes.local_uri,
        status: statusRes.status === 'ready' ? 'completed' : statusRes.status === 'failed' ? 'failed' : 'processing',
        errorMessage: statusRes.error_message || statusRes.error,
      });
    } catch (e) {
      // Resilience during history save
    }
  };

  useEffect(() => {
    if (!downloadJobId) return;

    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await getDownloadStatus(downloadJobId);
        setCurrentStatus(res);

        if (res.status === 'ready' || res.status === 'failed') {
          if (res.status === 'failed') {
            setErrorMsg((res as any).message || res.error_message || 'Download failed. Please try again.');
          }
          await saveToHistory(res);
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

  const fileUrl = currentStatus.file_url || currentStatus.local_uri;

  const getMimeType = (urlStr: string) => {
    const lower = urlStr.toLowerCase();
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    return 'video/*';
  };

  const handleOpen = async () => {
    if (!fileUrl) return;
    try {
      if (RNPlatform.OS === 'android') {
        const mimeType = getMimeType(fileUrl);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: fileUrl,
          type: mimeType,
          flags: 1,
        });
      } else {
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) {
          await Linking.openURL(fileUrl);
        } else {
          setModalTitle('File Location');
          setModalMessage(`Your media file is ready at:\n${fileUrl}`);
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
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      <CustomErrorModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onDismiss={() => setModalVisible(false)}
      />

      {/* Top Header Bar matching Home */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Seal Extraction Status</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.card}>
          {/* Status Header */}
          <View style={styles.statusHeaderRow}>
            {isDownloading && (
              <View style={[styles.statusBadge, styles.statusBadgeDownloading]}>
                <Text style={styles.statusBadgeTextDownloading}>Downloading</Text>
              </View>
            )}
            {isComplete && (
              <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                <Text style={styles.statusBadgeTextSuccess}>Ready</Text>
              </View>
            )}
            {isFailed && (
              <View style={[styles.statusBadge, styles.statusBadgeFailed]}>
                <Text style={styles.statusBadgeTextFailed}>Failed</Text>
              </View>
            )}
          </View>

          <Text style={styles.statusTitle}>
            {isDownloading && 'Downloading Media File'}
            {isComplete && 'Download Completed'}
            {isFailed && 'Download Unsuccessful'}
          </Text>

          <Text style={styles.statusSubtext} numberOfLines={2}>
            {isDownloading && `Extracting ${title} (${selectedQuality})...`}
            {isComplete && `Your file "${title}" is saved and ready.`}
            {isFailed && (errorMsg || 'An error occurred during extraction.')}
          </Text>

          {/* Progress Card Section */}
          {isDownloading && (
            <View style={styles.progressContainer} testID="progress-card">
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressLabel}>Processing Progress</Text>
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
                <Text style={styles.primaryButtonText}>Open File</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
                activeOpacity={0.8}
                testID="done-btn"
              >
                <Text style={styles.secondaryButtonText}>Back to Search</Text>
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
                testID={isFailed ? 'btn-retry-home' : 'done-btn'}
              >
                <Text style={styles.cancelButtonText}>
                  {isDownloading ? 'Cancel Download' : 'Back to Search'}
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
    backgroundColor: DARK_BG,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: DARK_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_COLOR,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  statusHeaderRow: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeDownloading: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  statusBadgeTextDownloading: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(163, 212, 141, 0.15)',
    borderColor: 'rgba(163, 212, 141, 0.3)',
  },
  statusBadgeTextSuccess: {
    color: LIME_ACCENT,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeTextFailed: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_COLOR,
    marginBottom: 6,
  },
  statusSubtext: {
    fontSize: 14,
    color: SUBTEXT_COLOR,
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
    color: SUBTEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercentText: {
    color: LIME_ACCENT,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: DARK_BG,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: LIME_ACCENT,
    borderRadius: 4,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: LIME_ACCENT,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: DARK_BG,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
});
