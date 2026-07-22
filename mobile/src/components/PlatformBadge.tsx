import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Platform } from '../types';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'medium',
  showLabel = true,
}) => {
  const getBadgeConfig = () => {
    switch (platform) {
      case 'youtube':
        return {
          label: 'YouTube',
          icon: '▶',
          bgColor: '#FF000020',
          textColor: '#FF4D4D',
          borderColor: '#FF000040',
        };
      case 'tiktok':
        return {
          label: 'TikTok',
          icon: '🎵',
          bgColor: '#00F2FE20',
          textColor: '#00F2FE',
          borderColor: '#00F2FE40',
        };
      case 'instagram':
        return {
          label: 'Instagram',
          icon: '📸',
          bgColor: '#E1306C20',
          textColor: '#F77737',
          borderColor: '#E1306C40',
        };
      case 'facebook':
        return {
          label: 'Facebook',
          icon: '🔵',
          bgColor: 'rgba(24, 119, 242, 0.15)',
          textColor: '#1877F2',
          borderColor: 'rgba(24, 119, 242, 0.3)',
        };
      default:
        return {
          label: 'Universal Web',
          icon: '🌐',
          bgColor: '#38BDF820',
          textColor: '#38BDF8',
          borderColor: '#38BDF840',
        };
    }
  };

  const config = getBadgeConfig();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        isSmall && styles.containerSmall,
        isLarge && styles.containerLarge,
      ]}
      testID={`platform-badge-${platform}`}
    >
      <Text style={[styles.icon, isSmall && styles.iconSmall, isLarge && styles.iconLarge]}>
        {config.icon}
      </Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: config.textColor },
            isSmall && styles.labelSmall,
            isLarge && styles.labelLarge,
          ]}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  containerLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  iconSmall: {
    fontSize: 11,
  },
  iconLarge: {
    fontSize: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 11,
  },
  labelLarge: {
    fontSize: 15,
  },
});
