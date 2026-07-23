import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform as RNPlatform,
} from 'react-native';

interface LoadingScreenProps {
  message?: string;
  url?: string;
}

// oklch(0.66 0.16 252) -> Electric Royal Blue #0B4DDE
const PRIMARY_COLOR = '#0B4DDE';

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Analyzing media link...',
}) => {
  return (
    <SafeAreaView style={styles.container} testID="loading-screen">
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />

      {/* Top Bar Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Media Downloader</Text>
      </View>

      <View style={styles.content}>
        {/* Glass Card Container */}
        <View style={styles.card}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} style={styles.spinner} />
          <Text style={styles.messageText}>{message}</Text>
          <Text style={styles.subtext}>
            Extracting available video qualities and audio streams...
          </Text>

          <View style={styles.stepDotsRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepDot} />
          </View>
        </View>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
    transform: [{ scale: 1.2 }],
  },
  messageText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27272A',
  },
  stepDotActive: {
    backgroundColor: PRIMARY_COLOR,
    width: 20,
  },
});
