import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform as RNPlatform,
} from 'react-native';
import { AnalyzeResponse, VideoFormat, AudioFormat, AudioCodec } from '../types';
import { PlatformBadge } from '../components/PlatformBadge';

interface ResultsScreenProps {
  data: AnalyzeResponse;
  onSelectFormat: (formatType: 'video' | 'audio', quality: string, options?: { startTime?: string; endTime?: string }) => void;
  onBack: () => void;
}

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const CARD_BG = '#2D2E28';
const BORDER_COLOR = '#3F4139';
const TEXT_COLOR = '#FAFAFA';
const SUBTEXT_COLOR = '#C7C8BE';

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  data,
  onSelectFormat,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [imageError, setImageError] = useState(false);

  // Audio extraction options
  const [selectedCodec, setSelectedCodec] = useState<AudioCodec>('MP3');

  // Video clipping options
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} testID="results-screen">
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

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

        {/* Audio Codec Selector when Audio tab is active */}
        {activeTab === 'audio' && (
          <View style={styles.codecBox}>
            <Text style={styles.codecLabel}>SELECT AUDIO CODEC</Text>
            <View style={styles.codecRow}>
              {(['MP3', 'M4A', 'FLAC', 'OPUS'] as AudioCodec[]).map((codec) => (
                <TouchableOpacity
                  key={codec}
                  style={[styles.codecPill, selectedCodec === codec && styles.codecPillActive]}
                  onPress={() => setSelectedCodec(codec)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.codecPillText, selectedCodec === codec && styles.codecPillTextActive]}>
                    {codec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Video Clip Range Selector (Optional) */}
        <View style={styles.clipBox}>
          <Text style={styles.clipLabel}>VIDEO CLIPPING RANGE (OPTIONAL)</Text>
          <View style={styles.clipInputsRow}>
            <View style={styles.clipInputGroup}>
              <Text style={styles.clipInputTag}>Start Time</Text>
              <TextInput
                style={styles.clipInput}
                placeholder="00:00"
                placeholderTextColor="#8C8D82"
                value={startTime}
                onChangeText={setStartTime}
                autoCapitalize="none"
                autoCorrect={false}
                testID="clip-start-input"
              />
            </View>
            <View style={styles.clipInputGroup}>
              <Text style={styles.clipInputTag}>End Time</Text>
              <TextInput
                style={styles.clipInput}
                placeholder="02:30"
                placeholderTextColor="#8C8D82"
                value={endTime}
                onChangeText={setEndTime}
                autoCapitalize="none"
                autoCorrect={false}
                testID="clip-end-input"
              />
            </View>
          </View>
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
                      onPress={() => onSelectFormat('video', fmt.quality, { startTime, endTime })}
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
                    <Text style={styles.fpsText}>High Quality {selectedCodec}</Text>
                  </View>
                </View>

                <View style={styles.formatRight}>
                  <Text style={styles.sizeText}>~{fmt.filesize_mb.toFixed(1)} MB</Text>
                  <TouchableOpacity
                    style={[styles.downloadButton, styles.downloadButtonAudio]}
                    onPress={() => onSelectFormat('audio', fmt.quality, { startTime, endTime })}
                    activeOpacity={0.85}
                    testID={`dl-btn-audio-${fmt.quality}`}
                  >
                    <Text style={styles.downloadButtonAudioText}>Extract {selectedCodec}</Text>
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
    backgroundColor: DARK_BG,
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
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: SURFACE_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  backText: {
    color: TEXT_COLOR,
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
    backgroundColor: CARD_BG,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 20,
  },
  thumbnailContainer: {
    height: 180,
    width: '100%',
    backgroundColor: DARK_BG,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
  },
  fallbackIconText: {
    color: SUBTEXT_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(27, 28, 24, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  durationText: {
    color: TEXT_COLOR,
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
    color: TEXT_COLOR,
    lineHeight: 22,
    marginBottom: 6,
  },
  uploader: {
    fontSize: 13,
    color: SUBTEXT_COLOR,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: SURFACE_BG,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
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
    backgroundColor: LIME_ACCENT,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: SUBTEXT_COLOR,
  },
  tabTextActive: {
    color: DARK_BG,
    fontWeight: '700',
  },
  codecBox: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 16,
  },
  codecLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codecRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codecPill: {
    flex: 1,
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  codecPillActive: {
    backgroundColor: LIME_ACCENT,
    borderColor: LIME_ACCENT,
  },
  codecPillText: {
    color: SUBTEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  codecPillTextActive: {
    color: DARK_BG,
    fontWeight: '700',
  },
  formatList: {
    gap: 10,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  formatLeft: {
    gap: 6,
  },
  qualityBadge: {
    backgroundColor: 'rgba(163, 212, 141, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(163, 212, 141, 0.3)',
  },
  qualityText: {
    color: LIME_ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  qualityBadgeAudio: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  qualityTextAudio: {
    color: '#EAB308',
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extBadge: {
    color: SUBTEXT_COLOR,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fpsText: {
    color: '#8C8D82',
    fontSize: 11,
  },
  formatRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  sizeText: {
    color: TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  downloadButton: {
    backgroundColor: LIME_ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadButtonAudio: {
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: LIME_ACCENT,
  },
  downloadButtonText: {
    color: DARK_BG,
    fontSize: 13,
    fontWeight: '700',
  },
  downloadButtonAudioText: {
    color: LIME_ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: SUBTEXT_COLOR,
    textAlign: 'center',
    paddingVertical: 20,
  },
  clipBox: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 16,
  },
  clipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: LIME_ACCENT,
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clipInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clipInputGroup: {
    flex: 1,
  },
  clipInputTag: {
    fontSize: 11,
    color: SUBTEXT_COLOR,
    marginBottom: 4,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clipInput: {
    backgroundColor: DARK_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    height: 38,
    paddingHorizontal: 10,
    color: TEXT_COLOR,
    fontSize: 12,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
