import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform as RNPlatform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnalyzeResponse, VideoFormat, AudioFormat } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { Colors } from '../theme/theme';
import { SmartThumbnail } from '../components/SmartThumbnail';
import { hapticLight, hapticSelection, hapticSuccess } from '../services/haptics';
import { MeshGradientBackground } from '../components/MeshGradientBackground';

interface ResultsScreenProps {
  data: AnalyzeResponse;
  onSelectFormat: (formatType: 'video' | 'audio', quality: string) => void;
  onBack: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  data,
  onSelectFormat,
  onBack,
}) => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<'mp3' | 'm4a' | 'wav'>('mp3');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<'128kbps' | '192kbps' | '320kbps'>('192kbps');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const videoFormats: VideoFormat[] = data.video_formats && data.video_formats.length > 0
    ? data.video_formats
    : [
        { quality: '1080p', ext: 'mp4', filesize_mb: 45.2, fps: 60 },
        { quality: '720p', ext: 'mp4', filesize_mb: 22.8, fps: 30 },
        { quality: '480p', ext: 'mp4', filesize_mb: 12.1, fps: 30 },
      ];

  const audioBitrates: Array<{ label: string; bitrate: '128kbps' | '192kbps' | '320kbps'; size: string }> = [
    { label: '320 kbps (High Quality)', bitrate: '320kbps', size: '~8.5 MB' },
    { label: '192 kbps (Medium Quality)', bitrate: '192kbps', size: '~5.2 MB' },
    { label: '128 kbps (Standard Quality)', bitrate: '128kbps', size: '~3.4 MB' },
  ];

  const handleDownloadPress = () => {
    hapticSuccess();
    if (activeTab === 'video') {
      const selectedFormat = videoFormats[selectedVideoIndex] || videoFormats[0];
      onSelectFormat('video', selectedFormat.quality);
    } else {
      const defaultQuality = data?.audio_formats?.[0]?.quality || '192kbps';
      onSelectFormat('audio', `${selectedAudioFormat}-${selectedAudioBitrate}-${defaultQuality}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="results-screen">
      <MeshGradientBackground />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          testID="results-back-btn"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media Results</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Thumbnail & Platform Badge Box */}
        <View style={styles.thumbnailBox}>
          <SmartThumbnail
            uri={data.thumbnail}
            platform={data.platform}
            resizeMode="cover"
            fallbackText={data.platform ? data.platform.toUpperCase() : 'MEDIA PREVIEW'}
            isFallbackThumbnail={data.thumbnail_is_fallback}
          />

          {/* Platform Badge Overlay */}
          <View style={styles.platformBadgeOverlay}>
            <Text style={styles.platformBadgeText}>
              {(data.platform || 'UNKNOWN').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Media Metadata Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.mediaTitle} numberOfLines={3}>
            {data.title || 'Media Content'}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.uploader || 'Unknown Creator'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{formatDuration(data.duration_seconds || 0)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 2-Tab Format Selector Bar (Video & Audio) */}
        <View style={styles.tabsBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { hapticSelection(); setActiveTab('video'); }}
            activeOpacity={0.8}
            testID="tab-video"
          >
            <Ionicons
              name="videocam-outline"
              size={16}
              color={activeTab === 'video' ? Colors.white : Colors.textTertiary}
            />
            <Text style={[styles.tabLabel, activeTab === 'video' && styles.tabLabelActive]}>
              Video
            </Text>
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { hapticSelection(); setActiveTab('audio'); }}
            activeOpacity={0.8}
            testID="tab-audio"
          >
            <Ionicons
              name="musical-notes-outline"
              size={16}
              color={activeTab === 'audio' ? Colors.white : Colors.textTertiary}
            />
            <Text style={[styles.tabLabel, activeTab === 'audio' && styles.tabLabelActive]}>
              Audio
            </Text>
          </TouchableOpacity>
        </View>

        {/* Indicator Underline Row */}
        <View style={styles.indicatorRow}>
          <View style={[styles.indicatorSegment, activeTab === 'video' ? styles.indicatorActive : styles.indicatorInactive]} />
          <View style={[styles.indicatorSegment, activeTab === 'audio' ? styles.indicatorActive : styles.indicatorInactive]} />
        </View>

        {/* Tab Content List */}
        <View style={styles.contentSection}>
          {activeTab === 'video' && (
            <View>
              <Text style={styles.sectionHeader}>VIDEO QUALITY</Text>
              {videoFormats.map((fmt, idx) => {
                const isSelected = selectedVideoIndex === idx;
                return (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={styles.formatRow}
                      onPress={() => { hapticLight(); setSelectedVideoIndex(idx); }}
                      activeOpacity={0.7}
                      testID={`video-format-${fmt.quality}`}
                    >
                      <View style={styles.formatLeft}>
                        <View style={[styles.selectionDot, isSelected && styles.selectionDotActive]}>
                          {isSelected && <View style={styles.selectionDotInner} />}
                        </View>
                        <View style={styles.formatTextCol}>
                          <Text style={[styles.qualityTitle, isSelected && styles.textWhite]}>
                            {fmt.quality}
                          </Text>
                          <Text style={styles.formatMetaSub}>
                            {(fmt.ext || 'MP4').toUpperCase()} · {fmt.fps || 30}fps
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.formatSizeText, isSelected && styles.textWhite]}>
                        {fmt.filesize_mb ? `${fmt.filesize_mb} MB` : 'Auto'}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.rowDivider} />
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {activeTab === 'audio' && (
            <View>
              <Text style={styles.sectionHeader}>AUDIO BITRATE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['mp3', 'm4a', 'wav'].map((ext) => (
                  <TouchableOpacity
                    key={ext}
                    testID={`audio-format-selector-${ext}`}
                    onPress={() => { hapticLight(); setSelectedAudioFormat(ext as any); }}
                    style={styles.formatPill}
                  >
                    <Text style={styles.formatPillText}>{ext.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {audioBitrates.map((item, idx) => {
                const isSelected = selectedAudioBitrate === item.bitrate;
                return (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={styles.formatRow}
                      onPress={() => { hapticLight(); setSelectedAudioBitrate(item.bitrate); }}
                      activeOpacity={0.7}
                      testID={`audio-bitrate-selector-${item.bitrate}`}
                    >
                      <View style={styles.formatLeft}>
                        <View style={[styles.selectionDot, isSelected && styles.selectionDotActive]}>
                          {isSelected && <View style={styles.selectionDotInner} />}
                        </View>
                        <View style={styles.formatTextCol}>
                          <Text style={[styles.qualityTitle, isSelected && styles.textWhite]}>
                            {item.label}
                          </Text>
                          <Text style={styles.formatMetaSub}>Audio Extraction ({selectedAudioFormat.toUpperCase()})</Text>
                        </View>
                      </View>
                      <Text style={[styles.formatSizeText, isSelected && styles.textWhite]}>
                        {item.size}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.rowDivider} />
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* Fixed Download Action Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadPress}
          activeOpacity={0.85}
          testID={
            activeTab === 'audio'
              ? 'dl-btn-audio-192kbps'
              : 'start-download-btn'
          }
        >
          <Ionicons name="download-outline" size={20} color={Colors.black} />
          <Text style={styles.downloadButtonText}>Download Now</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.black,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.glassBorder,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 100, // Safe padding for iPhone floating navbar
  },
  thumbnailBox: {
    height: 220,
    backgroundColor: Colors.surfaceCard,
    position: 'relative',
    overflow: 'hidden',
  },
  platformBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  platformBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formatPill: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  formatPillText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 6,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaDot: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.glassBorder,
  },
  tabsBar: {
    height: 48,
    flexDirection: 'row',
    backgroundColor: Colors.black,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 0.5,
    backgroundColor: Colors.glassBorder,
  },
  indicatorRow: {
    flexDirection: 'row',
    height: 1,
  },
  indicatorSegment: {
    flex: 1,
  },
  indicatorActive: {
    backgroundColor: Colors.white,
  },
  indicatorInactive: {
    backgroundColor: Colors.glassBorder,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginVertical: 12,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  formatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.glassBorderHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDotActive: {
    borderColor: Colors.white,
    backgroundColor: Colors.white,
  },
  selectionDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.black,
  },
  formatTextCol: {
    gap: 2,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  formatMetaSub: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  formatSizeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  rowDivider: {
    height: 0.5,
    backgroundColor: Colors.glassBorder,
  },
  downloadButton: {
    height: 52,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
  textWhite: {
    color: Colors.white,
  },
});
