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

// oklch(0.66 0.16 252) -> Electric Royal Blue #0B4DDE
const PRIMARY_COLOR = '#0B4DDE';

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

  // Custom modal for file opening errors or copy fallback
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
        setCurrentStatus(res);

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
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      <CustomErrorModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onDismiss={() => setModalVisible(false)}
      />

      {/* Top Header Bar matching Home */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Media Downloader</Text>
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
            {isDownloading && `Downloading ${title} (${selectedQuality})...`}
            {isComplete && `Your file "${title}" is ready.`}
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
                testID={isFailed ? "btn-retry-home" : "done-btn"}
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
    backgroundColor: '#09090B',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
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
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
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
    backgroundColor: 'rgba(11, 77, 222, 0.15)',
    borderColor: 'rgba(11, 77, 222, 0.3)',
  },
  statusBadgeTextDownloading: {
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusBadgeTextSuccess: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeFailed: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  statusBadgeTextFailed: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 6,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#A1A1AA',
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
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercentText: {
    color: PRIMARY_COLOR,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#09090B',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 4,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#19191E',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#19191E',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '600',
  },
});
