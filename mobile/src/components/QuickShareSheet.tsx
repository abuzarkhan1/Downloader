import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Platform as RNPlatform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';
import { analyzeUrl, startDownload, getDownloadStatus, detectPlatform } from '../services/api';
import { AnalyzeResponse, DownloadStatusResponse } from '../types';
import { SmartThumbnail } from './SmartThumbnail';
import { hapticLight, hapticSelection, hapticSuccess } from '../services/haptics';

export function detectPlatformFromUrl(url: string | null | undefined): string {
  if (!url) return 'unknown';
  return detectPlatform(url);
}

export function extractUrlFromSharedText(text: string | null | undefined): string | null {
  if (!text || text.trim() === '') return null;
  const urlRegex = /(https?:\/\/[\w\d:#@%/$()~_?\+-=\.\&]+)/;
  const match = text.match(urlRegex);
  if (match) return match[1];
  if (text.startsWith('http://') || text.startsWith('https://')) return text;
  return null;
}

export interface QuickShareSheetProps {
  visible?: boolean;
  sharedUrl: string | null;
  onClose?: () => void;
  onDismiss?: () => void;
  onStartDownload?: (url: string, title: string, type: string, detail: string) => void;
  onOpenMainApp?: () => void;
  onOpenFullApp?: () => void;
  onAnalyze?: (url: string) => void;
  onSelectFormat?: (formatType: string, quality: string) => void;
}

export const QuickShareSheet: React.FC<QuickShareSheetProps> = ({
  visible = true,
  sharedUrl,
  onClose,
  onDismiss,
  onStartDownload,
  onOpenMainApp,
  onOpenFullApp,
  onAnalyze,
  onSelectFormat,
}) => {
  const handleClose = () => {
    if (onDismiss) onDismiss();
    if (onClose) onClose();
  };

  const handleOpenApp = () => {
    if (onAnalyze && sharedUrl) {
      onAnalyze(sharedUrl);
    } else {
      if (onOpenFullApp) onOpenFullApp();
      if (onOpenMainApp) onOpenMainApp();
    }
    handleClose();
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null);
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatusResponse | null>(null);
  const [imageError, setImageError] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState('1080p');

  useEffect(() => {
    if (visible && sharedUrl) {
      setIsAnalyzing(true);
      setImageError(false);
      analyzeUrl(sharedUrl)
        .then((data) => {
          setAnalyzeData(data);
          setIsAnalyzing(false);
        })
        .catch(() => {
          setIsAnalyzing(false);
        });
    }
  }, [sharedUrl, visible]);

  if (!visible || !sharedUrl || sharedUrl.trim() === '') return null;

  const handleStartDownload = async () => {
    hapticSuccess();
    if (onSelectFormat) {
      onSelectFormat(selectedFormat, selectedQuality);
      handleClose();
      return;
    }
    if (onAnalyze && sharedUrl) {
      onAnalyze(sharedUrl);
      handleClose();
      return;
    }
    if (analyzeData) {
      try {
        const job = await startDownload(analyzeData.id, selectedFormat, selectedQuality);
        setDownloadJobId(job.download_job_id);
        const status = await getDownloadStatus(job.download_job_id);
        setDownloadStatus(status);
      } catch (e) {
        // Handle download error
      }
    }
  };

  const thumbnailUri = analyzeData?.thumbnail
    ? analyzeData.thumbnail.startsWith('//')
      ? `https:${analyzeData.thumbnail}`
      : analyzeData.thumbnail
    : null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={handleClose}
      testID="quick-share-sheet"
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          <View style={styles.contentPadding}>
            {/* FlashOn Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleGroup}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color={Colors.white} />
                <Text style={styles.headerTitle}>Quick Download</Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={handleClose}
                activeOpacity={0.7}
                testID="quick-share-close-btn"
              >
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Black70 Media Preview Card */}
            <View style={styles.mediaCard}>
              <SmartThumbnail
                uri={analyzeData?.thumbnail}
                platform={analyzeData?.platform}
                containerStyle={{ width: 54, height: 54, borderRadius: 8 }}
                style={{ width: 54, height: 54, borderRadius: 8 }}
                fallbackIconName="film-outline"
                isFallbackThumbnail={analyzeData?.thumbnail_is_fallback}
              />
              <View style={styles.mediaDetails}>
                <Text style={styles.mediaTitle} numberOfLines={2}>
                  {isAnalyzing ? 'Analyzing Media Link...' : (analyzeData?.title || 'Shared Link Content')}
                </Text>
                <Text style={styles.previewUrl} numberOfLines={1}>
                  {sharedUrl}
                </Text>
              </View>
            </View>

            {/* FormatTypeChip Row */}
            <View style={styles.formatTypeRow}>
              <TouchableOpacity
                style={[styles.chipContainer, selectedFormat === 'video' ? styles.chipSelected : styles.chipUnselected]}
                onPress={() => { hapticSelection(); setSelectedFormat('video'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam-outline" size={15} color={selectedFormat === 'video' ? Colors.white : Colors.textTertiary} />
                <Text style={[styles.chipLabel, selectedFormat === 'video' ? styles.chipLabelSelected : styles.chipLabelUnselected]}>
                  Video
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chipContainer, selectedFormat === 'audio' ? styles.chipSelected : styles.chipUnselected]}
                onPress={() => { hapticSelection(); setSelectedFormat('audio'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="musical-notes-outline" size={15} color={selectedFormat === 'audio' ? Colors.white : Colors.textTertiary} />
                <Text style={[styles.chipLabel, selectedFormat === 'audio' ? styles.chipLabelSelected : styles.chipLabelUnselected]}>
                  Audio
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quality options list */}
            <View style={styles.qualityList}>
              {['1080p (Full HD)', '720p (HD)', '480p (SD)'].map((qLabel) => {
                const qVal = qLabel.split(' ')[0];
                const isSelected = selectedQuality === qVal;
                return (
                  <TouchableOpacity
                    key={qVal}
                    testID={`format-option-${qVal}`}
                    style={[styles.qualityRow, isSelected ? styles.qualityRowSelected : styles.qualityRowUnselected]}
                    onPress={() => { hapticLight(); setSelectedQuality(qVal); }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.qualityLeft}>
                      <View style={[styles.radioOuter, isSelected ? styles.radioOuterSelected : styles.radioOuterUnselected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.qualityLabel, isSelected ? styles.qualityLabelSelected : styles.qualityLabelUnselected]}>
                        {qLabel}
                      </Text>
                    </View>
                    <Text style={styles.qualitySubtext}>MP4</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {downloadStatus && (
              <View style={styles.progressRow}>
                <Text testID="quick-share-progress-text" style={styles.progressText}>
                  {downloadStatus.progress_percent}%
                </Text>
              </View>
            )}

            {/* White Download Now button */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleStartDownload}
              activeOpacity={0.9}
              testID="quick-share-download-btn"
            >
              <Ionicons name="download-outline" size={18} color={Colors.black} />
              <Text style={styles.downloadButtonText}>Download Now</Text>
            </TouchableOpacity>

            {/* Open in Full App button */}
            <TouchableOpacity
              style={styles.openFullAppButton}
              onPress={handleOpenApp}
              activeOpacity={0.7}
              testID="quick-share-open-app-btn"
            >
              <Text style={styles.openFullAppText}>Open in Full App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default QuickShareSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: Colors.black80,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: RNPlatform.OS === 'ios' ? 32 : 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dividerLight,
    alignSelf: 'center',
    marginVertical: 10,
  },
  contentPadding: {
    paddingHorizontal: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  closeIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.dividerColor,
    width: '100%',
  },
  mediaCard: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.black70,
    borderWidth: 0.5,
    borderColor: Colors.dividerColor,
    padding: 10,
    alignItems: 'center',
    gap: 12,
  },
  thumbnailImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: Colors.black60,
  },
  thumbnailPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: Colors.black60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDetails: {
    flex: 1,
    gap: 4,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  previewUrl: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  formatTypeRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  chipContainer: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 0.5,
  },
  chipSelected: {
    backgroundColor: Colors.black60,
    borderColor: Colors.white,
  },
  chipUnselected: {
    backgroundColor: Colors.black70,
    borderColor: Colors.dividerColor,
  },
  chipLabel: {
    fontSize: 12,
  },
  chipLabelSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  chipLabelUnselected: {
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  qualityList: {
    gap: 6,
  },
  qualityRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qualityRowSelected: {
    backgroundColor: Colors.black70,
  },
  qualityRowUnselected: {
    backgroundColor: 'transparent',
  },
  qualityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.white,
    backgroundColor: Colors.white,
  },
  radioOuterUnselected: {
    borderColor: Colors.textTertiary,
    backgroundColor: 'transparent',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.black,
  },
  qualityLabel: {
    fontSize: 12,
  },
  qualityLabelSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  qualityLabelUnselected: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  qualitySubtext: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  progressRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  downloadButton: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonText: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 14,
  },
  openFullAppButton: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openFullAppText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
