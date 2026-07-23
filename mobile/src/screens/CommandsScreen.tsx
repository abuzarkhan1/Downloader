import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { sealColors, sealRadii, sealTypography } from '../theme/sealTheme';

export const CommandsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Custom Commands</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>⚡</Text>
          <Text style={styles.emptyTitle}>yt-dlp Commands</Text>
          <Text style={styles.emptySubtitle}>
            Configure custom extra arguments, cookies, and extractor flags for advanced downloading.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: sealColors.background,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: sealColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: sealColors.border,
  },
  headerTitle: {
    fontSize: sealTypography.sizes.subheading,
    fontWeight: sealTypography.weights.bold,
    color: sealColors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  emptyCard: {
    backgroundColor: sealColors.surfaceContainer,
    borderRadius: sealRadii.xl,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: sealColors.border,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: sealTypography.sizes.heading,
    fontWeight: sealTypography.weights.bold,
    color: sealColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: sealTypography.sizes.body,
    color: sealColors.textSecondary,
    textAlign: 'center',
  },
});

export default CommandsScreen;
