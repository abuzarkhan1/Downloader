import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { sealColors, sealRadii, sealTypography } from '../theme/sealTheme';

export interface SealButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'tonal' | 'outlined' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const SealButton: React.FC<SealButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  testID = 'seal-button',
}) => {
  const isPrimary = variant === 'primary';
  const isTonal = variant === 'tonal';
  const isOutlined = variant === 'outlined';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        isPrimary && styles.primaryBtn,
        isTonal && styles.tonalBtn,
        isOutlined && styles.outlinedBtn,
        isDanger && styles.dangerBtn,
        disabled && styles.disabledBtn,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary || isDanger ? sealColors.onPrimary : sealColors.textPrimary}
        />
      ) : (
        <>
          {icon ? <Text style={styles.iconText}>{icon}</Text> : null}
          <Text
            style={[
              styles.textBase,
              isPrimary && styles.primaryText,
              isTonal && styles.tonalText,
              isOutlined && styles.outlinedText,
              isDanger && styles.dangerText,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: 48,
    borderRadius: sealRadii.pill, // MD3 full pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: sealColors.primary,
  },
  tonalBtn: {
    backgroundColor: sealColors.primaryContainer,
    borderWidth: 1,
    borderColor: sealColors.borderLight,
  },
  outlinedBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: sealColors.borderLight,
  },
  dangerBtn: {
    backgroundColor: sealColors.error,
  },
  disabledBtn: {
    backgroundColor: sealColors.surfaceContainerHigh,
    borderColor: sealColors.border,
    opacity: 0.6,
  },
  textBase: {
    fontSize: sealTypography.sizes.body,
    fontWeight: sealTypography.weights.bold,
  },
  primaryText: {
    color: sealColors.onPrimary,
  },
  tonalText: {
    color: sealColors.onPrimaryContainer,
  },
  outlinedText: {
    color: sealColors.textPrimary,
  },
  dangerText: {
    color: sealColors.textPrimaryWhite,
  },
  disabledText: {
    color: sealColors.textMuted,
  },
  iconText: {
    fontSize: 16,
  },
});

export default SealButton;
