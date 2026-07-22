import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform as RNPlatform,
} from 'react-native';
import { AnalyzeResponse, VideoFormat, AudioFormat } from '../types';
import { PlatformBadge } from '../components/PlatformBadge';

interface ResultsScreenProps {
  data: AnalyzeResponse;
  onSelectFormat: (formatType: 'video' | 'audio', quality: string) => void;
  onBack: () => void;
}

// oklch(0.66 0.16 252) -> Electric Royal Blue #0B4DDE
const PRIMARY_COLOR = '#0B4DDE';

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  data,
  onSelectFormat,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [imageError, setImageError] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} testID="results-screen">
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Top Navigation Header matching Home */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          testID="results-back-btn"
          activeOpacity={0.8}
        >
          <Text style={styles.backText}>← New Search</Text>
        </TouchableOpacity>
        <PlatformBadge platform={data.platform} size="small" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Media Preview Header Card */}
        <View style={styles.mediaCard}>
          <View style={styles.thumbnailContainer}>
            {!imageError && data.thumbnail ? (
              <Image
                source={{ uri: data.thumbnail }}
                style={styles.thumbnail}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                <Text style={styles.fallbackIconText}>Media Content</Text>
              </View>
            )}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(data.duration_seconds)}</Text>
            </View>
          </View>

          <View style={styles.mediaInfo}>
            <Text style={styles.title} numberOfLines={2}>
              {data.title}
            </Text>
            <Text style={styles.uploader}>By {data.uploader}</Text>
          </View>
        </View>

        {/* Format Selector Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'video' && styles.tabActive]}
            onPress={() => setActiveTab('video')}
            testID="tab-video"
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'video' && styles.tabTextActive]}>
              Video Formats ({data.video_formats.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'audio' && styles.tabActive]}
            onPress={() => setActiveTab('audio')}
            testID="tab-audio"
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'audio' && styles.tabTextActive]}>
              Audio Only ({data.audio_formats.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Format List */}
        <View style={styles.formatList}>
          {activeTab === 'video' ? (
            data.video_formats.length > 0 ? (
              data.video_formats.map((fmt: VideoFormat, idx: number) => (
                <View key={`v-${idx}`} style={styles.formatItem} testID={`video-format-${fmt.quality}`}>
                  <View style={styles.formatLeft}>
                    <View style={styles.qualityBadge}>
                      <Text style={styles.qualityText}>{fmt.quality}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.extBadge}>{fmt.ext.toUpperCase()}</Text>
                      {fmt.fps && <Text style={styles.fpsText}>{fmt.fps} FPS</Text>}
                    </View>
                  </View>

                  <View style={styles.formatRight}>
                    <Text style={styles.sizeText}>~{fmt.filesize_mb.toFixed(1)} MB</Text>
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => onSelectFormat('video', fmt.quality)}
                      activeOpacity={0.85}
                      testID={`dl-btn-video-${fmt.quality}`}
                    >
                      <Text style={styles.downloadButtonText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No video formats found.</Text>
            )
          ) : data.audio_formats.length > 0 ? (
            data.audio_formats.map((fmt: AudioFormat, idx: number) => (
              <View key={`a-${idx}`} style={styles.formatItem} testID={`audio-format-${fmt.quality}`}>
                <View style={styles.formatLeft}>
                  <View style={[styles.qualityBadge, styles.qualityBadgeAudio]}>
                    <Text style={styles.qualityTextAudio}>{fmt.quality}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.extBadge}>{fmt.ext.toUpperCase()}</Text>
                    <Text style={styles.fpsText}>High Quality MP3</Text>
                  </View>
                </View>

                <View style={styles.formatRight}>
                  <Text style={styles.sizeText}>~{fmt.filesize_mb.toFixed(1)} MB</Text>
                  <TouchableOpacity
                    style={[styles.downloadButton, styles.downloadButtonAudio]}
                    onPress={() => onSelectFormat('audio', fmt.quality)}
                    activeOpacity={0.85}
                    testID={`dl-btn-audio-${fmt.quality}`}
                  >
                    <Text style={styles.downloadButtonText}>Extract MP3</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No audio formats available.</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#19191E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  backText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  mediaCard: {
    backgroundColor: '#121215',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 20,
  },
  thumbnailContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#09090B',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121215',
  },
  fallbackIconText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  durationText: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mediaInfo: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    lineHeight: 22,
    marginBottom: 6,
  },
  uploader: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#121215',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  formatList: {
    gap: 10,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121215',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  formatLeft: {
    gap: 6,
  },
  qualityBadge: {
    backgroundColor: 'rgba(11, 77, 222, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(11, 77, 222, 0.3)',
  },
  qualityText: {
    color: PRIMARY_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  qualityBadgeAudio: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  qualityTextAudio: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extBadge: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fpsText: {
    color: '#666670',
    fontSize: 11,
  },
  formatRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  sizeText: {
    color: '#FAFAFA',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  downloadButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadButtonAudio: {
    backgroundColor: '#22C55E',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#A1A1AA',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
