import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Platform } from '../types';
import { sealColors, sealRadii, sealTypography } from '../theme/sealTheme';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'medium',
  showLabel = true,
  style,
}) => {
  const getBadgeConfig = () => {
    switch (platform) {
      case 'youtube':
        return {
          label: 'YouTube',
          icon: '▶',
          bgColor: 'rgba(255, 82, 82, 0.15)',
          textColor: '#FF5252',
          borderColor: 'rgba(255, 82, 82, 0.3)',
        };
      case 'tiktok':
        return {
          label: 'TikTok',
          icon: '🎵',
          bgColor: 'rgba(34, 211, 238, 0.15)',
          textColor: '#22D3EE',
          borderColor: 'rgba(34, 211, 238, 0.3)',
        };
      case 'instagram':
        return {
          label: 'Instagram',
          icon: '📸',
          bgColor: 'rgba(244, 114, 182, 0.15)',
          textColor: '#F472B6',
          borderColor: 'rgba(244, 114, 182, 0.3)',
        };
      case 'facebook':
        return {
          label: 'Facebook',
          icon: '🔵',
          bgColor: 'rgba(24, 119, 242, 0.15)',
          textColor: '#1877F2',
          borderColor: 'rgba(24, 119, 242, 0.3)',
        };
      case 'twitter':
        return {
          label: 'X (Twitter)',
          icon: '𝕏',
          bgColor: 'rgba(227, 227, 220, 0.15)',
          textColor: sealColors.textPrimary,
          borderColor: sealColors.borderLight,
        };
      default:
        return {
          label: 'Universal Web',
          icon: '🌐',
          bgColor: sealColors.primaryContainer,
          textColor: sealColors.onPrimaryContainer,
          borderColor: sealColors.borderLight,
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
        style,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: sealRadii.card, // MD3 16dp radius
    borderWidth: 1,
    gap: 6,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: sealRadii.md, // 12dp radius
    gap: 4,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: sealRadii.xl, // MD3 24dp radius
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
    fontSize: sealTypography.sizes.body,
    fontWeight: sealTypography.weights.semibold,
  },
  labelSmall: {
    fontSize: sealTypography.sizes.caption,
  },
  labelLarge: {
    fontSize: sealTypography.sizes.subheading,
  },
});

export default PlatformBadge;
