import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { Colors } from '../theme/theme';

interface LoadingScreenProps {
  message?: string;
  url?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
}) => {
  const { t } = useI18n();
  const displayMessage = message || t('analyzingMedia');

  return (
    <SafeAreaView style={styles.container} testID="loading-screen">
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Top Bar Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('appName')}</Text>
      </View>

      <View style={styles.content}>
        {/* Glass Card Container */}
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.white} style={styles.spinner} />
          <Text style={styles.messageText}>{displayMessage}</Text>
          <Text style={styles.subtext}>
            {t('heroSubtitle')}
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
    backgroundColor: Colors.black,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerColor,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    backgroundColor: Colors.black80,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
    transform: [{ scale: 1.2 }],
  },
  messageText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.black50,
  },
  stepDotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },
});
