import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  SafeAreaView,
  Platform as RNPlatform,
} from "react-native";
import {
  AnalyzeResponse,
  VideoFormat,
  AudioFormat,
  DownloadStatusResponse,
  Platform,
} from "../types";
import {
  analyzeUrl,
  detectPlatform,
  startDownload,
  getDownloadStatus,
  downloadAndSaveMedia,
  formatErrorMessage,
} from "../services/api";
import { PlatformBadge } from "./PlatformBadge";

export interface QuickShareSheetProps {
  visible: boolean;
  sharedUrl: string | null;
  onClose: () => void;
  onOpenMainApp?: () => void;
  onAnalyze?: (url: string) => void;
  onSelectFormat?: (formatType: 'video' | 'audio', quality: string) => void;
}

export function detectPlatformFromUrl(url: string | null | undefined): Platform {
  if (!url) return 'unknown';
  return detectPlatform(url);
}

const PRIMARY_COLOR = "#0B4DDE";
const CARD_BG = "#121215";
const BORDER_COLOR = "#27272A";
const OVERLAY_BG = "rgba(9, 9, 11, 0.82)";

export const QuickShareSheet: React.FC<QuickShareSheetProps> = ({
  visible,
  sharedUrl,
  onClose,
  onOpenMainApp,
  onAnalyze,
  onSelectFormat,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null);

  const [selectedFormatType, setSelectedFormatType] = useState<"video" | "audio">("video");
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatusResponse | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible && sharedUrl) {
      if (lastAnalyzedUrlRef.current !== sharedUrl) {
        lastAnalyzedUrlRef.current = sharedUrl;
        handleAnalyze(sharedUrl);
      }
    } else if (!visible) {
      lastAnalyzedUrlRef.current = null;
      resetState();
    }
  }, [visible, sharedUrl]);

  const resetState = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsAnalyzing(false);
    setAnalyzeError(null);
    setAnalyzeData(null);
    setSelectedFormatType("video");
    setSelectedQuality("1080p");
    setIsDownloading(false);
    setDownloadJobId(null);
    setDownloadStatus(null);
    setIsCompleted(false);
  };

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeData(null);
    setIsDownloading(false);
    setDownloadStatus(null);
    setIsCompleted(false);

    try {
      const data = await analyzeUrl(url);
      setAnalyzeData(data);
      if (data.video_formats && data.video_formats.length > 0) {
        setSelectedFormatType("video");
        setSelectedQuality(data.video_formats[0].quality);
      } else if (data.audio_formats && data.audio_formats.length > 0) {
        setSelectedFormatType("audio");
        setSelectedQuality(data.audio_formats[0].quality);
      }
    } catch (err: any) {
      const msg = err.message || formatErrorMessage(err.error_code);
      setAnalyzeError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartDownload = async () => {
    if (!analyzeData) return;

    setIsDownloading(true);
    setIsCompleted(false);
    setDownloadStatus({ status: "processing", progress_percent: 5 });

    try {
      const job = await startDownload(analyzeData.id, selectedFormatType, selectedQuality);
      setDownloadJobId(job.download_job_id);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await getDownloadStatus(job.download_job_id);
          setDownloadStatus(status);

          if (status.status === "ready") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsDownloading(false);
            setIsCompleted(true);
            if (status.file_url) {
              downloadAndSaveMedia(status.file_url).catch(() => {});
            }
          } else if (status.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsDownloading(false);
          }
        } catch (e) {
          // Continue polling resiliently
        }
      }, 800);
    } catch (err: any) {
      setIsDownloading(false);
      const msg = err.message || "Could not initiate download job.";
      setDownloadStatus({
        status: "failed",
        progress_percent: 0,
        error_message: msg,
      });
    }
  };

  if (!visible) return null;

  const detectedPlatform = sharedUrl ? detectPlatform(sharedUrl) : "unknown";
  const currentPlatform = analyzeData?.platform || detectedPlatform;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      testID="quick-share-sheet"
    >
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>Quick Share Download</Text>
              <PlatformBadge platform={currentPlatform} size="small" />
            </View>
            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={onClose}
              activeOpacity={0.7}
              testID="quick-share-close-btn"
            >
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isAnalyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={PRIMARY_COLOR}
                  testID="quick-share-analyzing-spinner"
                />
                <Text style={styles.loadingText}>Analyzing shared link...</Text>
                {sharedUrl && (
                  <Text style={styles.urlPreviewText} numberOfLines={1}>
                    {sharedUrl}
                  </Text>
                )}
              </View>
            )}

            {!isAnalyzing && analyzeError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Analysis Failed</Text>
                <Text style={styles.errorMessage}>{analyzeError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => sharedUrl && handleAnalyze(sharedUrl)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isAnalyzing && analyzeData && (
              <View style={styles.mediaContainer}>
                <View style={styles.mediaCard}>
                  {analyzeData.thumbnail ? (
                    <Image
                      source={{ uri: analyzeData.thumbnail }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Text style={styles.thumbnailPlaceholderIcon}>🎬</Text>
                    </View>
                  )}
                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaTitle} numberOfLines={2}>
                      {analyzeData.title}
                    </Text>
                    <Text style={styles.mediaMeta}>
                      {analyzeData.uploader}
                      {analyzeData.duration_seconds
                        ? ` • ${formatDuration(analyzeData.duration_seconds)}`
                        : ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      selectedFormatType === "video" && styles.tabButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedFormatType("video");
                      if (analyzeData.video_formats.length > 0) {
                        setSelectedQuality(analyzeData.video_formats[0].quality);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        selectedFormatType === "video" && styles.tabTextActive,
                      ]}
                    >
                      🎥 Video Formats
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      selectedFormatType === "audio" && styles.tabButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedFormatType("audio");
                      if (analyzeData.audio_formats.length > 0) {
                        setSelectedQuality(analyzeData.audio_formats[0].quality);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        selectedFormatType === "audio" && styles.tabTextActive,
                      ]}
                    >
                      🎵 Audio Formats
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formatList}>
                  {selectedFormatType === "video" ? (
                    analyzeData.video_formats.map((fmt: VideoFormat) => {
                      const isSelected = selectedQuality === fmt.quality;
                      return (
                        <TouchableOpacity
                          key={`v_${fmt.quality}`}
                          style={[
                            styles.formatCard,
                            isSelected && styles.formatCardSelected,
                          ]}
                          onPress={() => setSelectedQuality(fmt.quality)}
                          activeOpacity={0.7}
                          testID={`format-option-${fmt.quality}`}
                        >
                          <View style={styles.formatLeft}>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected,
                              ]}
                            >
                              {isSelected && <View style={styles.radioInnerCircle} />}
                            </View>
                            <Text style={styles.formatQuality}>{fmt.quality}</Text>
                            <Text style={styles.formatExt}>.{fmt.ext}</Text>
                            {fmt.fps ? (
                              <Text style={styles.formatBadge}>{fmt.fps}fps</Text>
                            ) : null}
                          </View>
                          <Text style={styles.formatSize}>
                            ~{fmt.filesize_mb.toFixed(1)} MB
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    analyzeData.audio_formats.map((fmt: AudioFormat) => {
                      const isSelected = selectedQuality === fmt.quality;
                      return (
                        <TouchableOpacity
                          key={`a_${fmt.quality}`}
                          style={[
                            styles.formatCard,
                            isSelected && styles.formatCardSelected,
                          ]}
                          onPress={() => setSelectedQuality(fmt.quality)}
                          activeOpacity={0.7}
                          testID={`format-option-${fmt.quality}`}
                        >
                          <View style={styles.formatLeft}>
                            <View
                              style={[
                                styles.radioCircle,
                                isSelected && styles.radioCircleSelected,
                              ]}
                            >
                              {isSelected && <View style={styles.radioInnerCircle} />}
                            </View>
                            <Text style={styles.formatQuality}>{fmt.quality}</Text>
                            <Text style={styles.formatExt}>.{fmt.ext}</Text>
                          </View>
                          <Text style={styles.formatSize}>
                            ~{fmt.filesize_mb.toFixed(1)} MB
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>

                {downloadStatus && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeaderRow}>
                      <Text style={styles.progressStatusLabel}>
                        {isCompleted
                          ? "✅ Download Ready!"
                          : downloadStatus.status === "failed"
                          ? "❌ Download Failed"
                          : "⚡ Downloading..."}
                      </Text>
                      <Text
                        style={styles.progressPercentText}
                        testID="quick-share-progress-text"
                      >
                        {downloadStatus.progress_percent || 0}%
                      </Text>
                    </View>

                    <View style={styles.progressBarTrack} testID="quick-share-progress-bar">
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${downloadStatus.progress_percent || 0}%` },
                          isCompleted && styles.progressBarFillSuccess,
                          downloadStatus.status === "failed" && styles.progressBarFillFailed,
                        ]}
                      />
                    </View>

                    {downloadStatus.error_message && (
                      <Text style={styles.downloadErrorText}>
                        {downloadStatus.error_message}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footerActions}>
            {!isCompleted ? (
              <TouchableOpacity
                style={[
                  styles.downloadButtonPrimary,
                  (isAnalyzing || !analyzeData || isDownloading) && styles.buttonDisabled,
                ]}
                onPress={handleStartDownload}
                disabled={isAnalyzing || !analyzeData || isDownloading}
                activeOpacity={0.85}
                testID="quick-share-download-btn"
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.downloadButtonText}>Download Now</Text>
                )}
              </TouchableOpacity>
            ) : null}

            <View style={styles.secondaryActionRow}>
              <TouchableOpacity
                style={styles.openAppButton}
                onPress={onOpenMainApp}
                activeOpacity={0.8}
                testID="quick-share-open-app-btn"
              >
                <Text style={styles.openAppButtonText}>Open Full App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeFooterButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeFooterButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: OVERLAY_BG,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    maxHeight: "85%",
    paddingBottom: RNPlatform.OS === "ios" ? 24 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3F3F46",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  closeIconButton: {
    padding: 6,
  },
  closeIconText: {
    fontSize: 18,
    color: "#A1A1AA",
    fontWeight: "600",
  },
  scrollBody: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: "#FAFAFA",
    fontSize: 15,
    fontWeight: "600",
  },
  urlPreviewText: {
    color: "#71717A",
    fontSize: 12,
    maxWidth: 280,
  },
  errorCard: {
    backgroundColor: "#19191E",
    borderColor: BORDER_COLOR,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  errorIcon: {
    fontSize: 28,
  },
  errorTitle: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "700",
  },
  errorMessage: {
    color: "#FF5252",
    fontSize: 13,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  mediaContainer: {
    gap: 16,
  },
  mediaCard: {
    flexDirection: "row",
    backgroundColor: "#09090B",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailPlaceholderIcon: {
    fontSize: 24,
  },
  mediaInfo: {
    flex: 1,
    gap: 4,
  },
  mediaTitle: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  mediaMeta: {
    color: "#A1A1AA",
    fontSize: 12,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#09090B",
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  formatList: {
    gap: 8,
  },
  formatCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formatCardSelected: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: "rgba(11, 77, 222, 0.1)",
  },
  formatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#71717A",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: PRIMARY_COLOR,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY_COLOR,
  },
  formatQuality: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "700",
  },
  formatExt: {
    color: "#A1A1AA",
    fontSize: 12,
    textTransform: "uppercase",
  },
  formatBadge: {
    fontSize: 10,
    color: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  formatSize: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "500",
  },
  progressContainer: {
    backgroundColor: "#09090B",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressStatusLabel: {
    color: "#FAFAFA",
    fontSize: 13,
    fontWeight: "600",
  },
  progressPercentText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#27272A",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 4,
  },
  progressBarFillSuccess: {
    backgroundColor: "#22C55E",
  },
  progressBarFillFailed: {
    backgroundColor: "#FF5252",
  },
  downloadErrorText: {
    color: "#FF5252",
    fontSize: 12,
  },
  footerActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  downloadButtonPrimary: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  openAppButton: {
    flex: 1,
    backgroundColor: "#19191E",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  openAppButtonText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "600",
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeFooterButtonText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
  },
});
