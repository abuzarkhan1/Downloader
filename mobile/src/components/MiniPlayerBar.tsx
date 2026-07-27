import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

interface MiniPlayerBarProps {
  title: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  onPress: () => void;
  thumbnailUrl?: string;
  formatType?: 'audio' | 'video';
}

export const MiniPlayerBar: React.FC<MiniPlayerBarProps> = ({
  title,
  isPlaying,
  onPlayPause,
  onClose,
  onPress,
  thumbnailUrl,
  formatType,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Mini player"
      accessibilityHint="Double tap to open full player"
    >
      <View style={styles.content}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.iconPlaceholder}>
            <Ionicons 
              name={formatType === 'audio' ? 'musical-notes' : 'videocam'} 
              size={20} 
              color={Colors.white} 
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle}>Now Playing</Text>
        </View>

        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={onPlayPause}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={Colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close mini player"
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, 
    left: 10,
    right: 10,
    backgroundColor: Colors.black80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.black70,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.black70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  actionBtn: {
    padding: 8,
  }
});
