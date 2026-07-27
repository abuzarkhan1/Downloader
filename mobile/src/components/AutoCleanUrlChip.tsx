import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shapes, Typography } from '../theme/theme';

interface AutoCleanUrlChipProps {
  originalUrl: string;
  cleanedUrl: string;
  onPress?: () => void;
}

export const AutoCleanUrlChip: React.FC<AutoCleanUrlChipProps> = ({ originalUrl, cleanedUrl, onPress }) => {
  const isCleaned = originalUrl !== cleanedUrl;

  if (!isCleaned) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={14} color={Colors.warnYellow} />
      </View>
      <Text style={styles.text} numberOfLines={1}>
        Tracking parameters removed
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceOverlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.borderRadiusPill,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignSelf: 'flex-start',
    gap: 6,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.textSecondary,
    ...Typography.labelMedium,
  },
});
