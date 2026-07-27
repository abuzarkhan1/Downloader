import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

export interface SmartThumbnailProps {
  uri?: string | null;
  platform?: string;
  videoId?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'center' | 'stretch';
  fallbackIconName?: keyof typeof Ionicons.glyphMap;
  fallbackText?: string;
}

const PLATFORM_FALLBACK_IMAGES: Record<string, string> = {
  youtube: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
  tiktok: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&q=80',
  instagram: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&q=80',
  facebook: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80',
  twitter: 'https://images.unsplash.com/photo-1611605698323-b1e992d3777f?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
};

export const SmartThumbnail: React.FC<SmartThumbnailProps> = ({
  uri,
  platform = 'youtube',
  videoId,
  style,
  containerStyle,
  resizeMode = 'cover',
  fallbackIconName = 'play-circle-outline',
  fallbackText,
}) => {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAllFailed, setHasAllFailed] = useState(false);

  useEffect(() => {
    const list: string[] = [];

    // Helper to format URI
    const clean = (input?: string | null) => {
      if (!input || typeof input !== 'string') return null;
      let trimmed = input.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (trimmed.startsWith('http://')) return `https://${trimmed.slice(7)}`;
      return trimmed;
    };

    const formattedUri = clean(uri);

    // YouTube ID extraction
    let extractedYtId = videoId;
    if (!extractedYtId && formattedUri) {
      const match = formattedUri.match(/(?:vi\/|v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        extractedYtId = match[1];
      }
    }

    if (extractedYtId) {
      list.push(`https://img.youtube.com/vi/${extractedYtId}/maxresdefault.jpg`);
      list.push(`https://i.ytimg.com/vi/${extractedYtId}/hqdefault.jpg`);
      list.push(`https://img.youtube.com/vi/${extractedYtId}/hqdefault.jpg`);
      list.push(`https://i.ytimg.com/vi/${extractedYtId}/mqdefault.jpg`);
    }

    if (formattedUri && !list.includes(formattedUri)) {
      list.push(formattedUri);
    }

    // Platform unsplash fallback
    const platformLower = (platform || '').toLowerCase();
    const fallbackImg = PLATFORM_FALLBACK_IMAGES[platformLower] || PLATFORM_FALLBACK_IMAGES['default'];
    if (!list.includes(fallbackImg)) {
      list.push(fallbackImg);
    }

    setCandidates(list);
    setCandidateIndex(0);
    setIsLoading(true);
    setHasAllFailed(false);
  }, [uri, platform, videoId]);

  const currentUri = candidates[candidateIndex];

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasAllFailed(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {currentUri && !hasAllFailed && (
        <Image
          source={{ uri: currentUri }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {isLoading && !hasAllFailed && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.white} />
        </View>
      )}

      {hasAllFailed && (
        <View style={styles.fallbackContainer}>
          <Ionicons name={fallbackIconName} size={36} color={Colors.textSecondary} />
          {fallbackText && <Text style={styles.fallbackText}>{fallbackText}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.black70,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  fallbackText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
