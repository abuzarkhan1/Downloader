import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { sealColors, sealRadii } from '../theme/sealTheme';

export interface SealCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  radius?: 'card' | 'xl' | 'sm' | 'md';
  style?: ViewStyle;
  testID?: string;
}

export const SealCard: React.FC<SealCardProps> = ({
  children,
  variant = 'filled',
  radius = 'card',
  style,
  testID = 'seal-card',
}) => {
  const getRadiusValue = () => {
    switch (radius) {
      case 'xl':
        return sealRadii.xl; // 24dp
      case 'card':
        return sealRadii.card; // 16dp
      case 'md':
        return sealRadii.md; // 12dp
      case 'sm':
        return sealRadii.sm; // 8dp
      default:
        return sealRadii.card;
    }
  };

  return (
    <View
      style={[
        styles.cardBase,
        { borderRadius: getRadiusValue() },
        variant === 'filled' && styles.filled,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    padding: 16,
    borderWidth: 1,
    borderColor: sealColors.border,
  },
  filled: {
    backgroundColor: sealColors.surfaceContainer,
    borderColor: sealColors.border,
  },
  elevated: {
    backgroundColor: sealColors.surfaceContainerHigh,
    borderColor: sealColors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: sealColors.borderLight,
  },
});

export default SealCard;
