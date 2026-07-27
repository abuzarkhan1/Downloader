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
  isFallbackThumbnail?: boolean;
}



export const SmartThumbnail: React.FC<SmartThumbnailProps> = ({
  uri,
  platform = 'youtube',
  videoId,
  style,
  containerStyle,
  resizeMode = 'cover',
  fallbackIconName = 'play-circle-outline',
  fallbackText,
  isFallbackThumbnail = false,
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

    if (formattedUri) {
      list.push(formattedUri);
    }

    if (extractedYtId) {
      const hq = `https://i.ytimg.com/vi/${extractedYtId}/hqdefault.jpg`;
      const maxres = `https://img.youtube.com/vi/${extractedYtId}/maxresdefault.jpg`;
      const mq = `https://i.ytimg.com/vi/${extractedYtId}/mqdefault.jpg`;
      
      if (!list.includes(hq)) list.push(hq);
      if (!list.includes(maxres)) list.push(maxres);
      if (!list.includes(mq)) list.push(mq);
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
      {!isFallbackThumbnail && currentUri && !hasAllFailed && (
        <Image
          key={currentUri}
          source={{ uri: currentUri }}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {!isFallbackThumbnail && isLoading && !hasAllFailed && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.white} />
        </View>
      )}

      {(isFallbackThumbnail || hasAllFailed) && (
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
