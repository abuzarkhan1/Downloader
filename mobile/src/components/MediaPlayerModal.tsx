import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';
import Slider from '@react-native-community/slider';

interface MediaPlayerModalProps {
  visible: boolean;
  uri: string | null;
  formatType?: 'video' | 'audio';
  title?: string;
  onClose: () => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  visible,
  uri,
  formatType = 'video',
  title = 'Media Player',
  onClose,
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible && uri) {
      setIsPlaying(true);
      setIsLoading(true);
    }
  }, [visible, uri]);

  const handlePlaybackStatusUpdate = (update: AVPlaybackStatus) => {
    setStatus(update);
    if (update.isLoaded) {
      setIsLoading(false);
      setIsPlaying(update.isPlaying);
    } else if (update.error) {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleSeek = async (value: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(value);
  };

  const isLoaded = status?.isLoaded;
  const duration = isLoaded ? status.durationMillis || 0 : 0;
  const position = isLoaded ? status.positionMillis || 0 : 0;

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.playerContainer}>
          {uri ? (
            <Video
              ref={videoRef}
              source={{ uri }}
              style={formatType === 'video' ? styles.video : styles.audioPlaceholder}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls={false}
              shouldPlay={visible}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
          ) : (
             <Text style={styles.errorText}>No media source found.</Text>
          )}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}
          {formatType === 'audio' && !isLoading && (
            <View style={styles.audioIconWrapper}>
              <Ionicons name="musical-notes" size={64} color={Colors.textTertiary} />
            </View>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={Colors.white}
            maximumTrackTintColor={Colors.dividerColor}
            thumbTintColor={Colors.white}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          <View style={styles.playRow}>
            <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={36} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: { flex: 1, color: Colors.white, fontSize: 18, fontWeight: '600', marginRight: 10 },
  closeBtn: { padding: 4 },
  playerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  audioPlaceholder: { width: 0, height: 0 },
  audioIconWrapper: { position: 'absolute' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.errorRed, fontSize: 16 },
  controlsContainer: { padding: 20, paddingBottom: 40, backgroundColor: Colors.black },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  timeText: { color: Colors.textSecondary, fontSize: 12 },
  playRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  playBtn: { padding: 10 },
});
