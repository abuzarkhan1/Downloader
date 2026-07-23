import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ViewStyle } from 'react-native';
import { sealColors, sealRadii, sealTypography } from '../theme/sealTheme';

export type NavDestination = 'home' | 'history' | 'commands' | 'settings';

export interface NavItemSpec {
  id: NavDestination;
  label: string;
  icon: string;
  badgeCount?: number;
}

export const NAV_DESTINATIONS: NavItemSpec[] = [
  { id: 'home', label: 'Home', icon: '⬇️' },
  { id: 'history', label: 'History', icon: '🕒' },
  { id: 'commands', label: 'Commands', icon: '⚡' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export interface SealNavigationBarProps {
  activeDestination: NavDestination;
  onSelectDestination: (destination: NavDestination) => void;
  destinations?: NavItemSpec[];
  style?: ViewStyle;
}

export const SealNavigationBar: React.FC<SealNavigationBarProps> = ({
  activeDestination,
  onSelectDestination,
  destinations = NAV_DESTINATIONS,
  style,
}) => {
  return (
    <View style={[styles.navBarContainer, style]} testID="seal-navigation-bar">
      <View style={styles.navBarContent}>
        {destinations.map((dest) => {
          const isActive = activeDestination === dest.id;
          return (
            <TouchableOpacity
              key={dest.id}
              style={styles.navItem}
              onPress={() => onSelectDestination(dest.id)}
              activeOpacity={0.7}
              testID={`nav-item-${dest.id}`}
            >
              <View
                style={[
                  styles.iconIndicator,
                  isActive && styles.iconIndicatorActive,
                ]}
              >
                <Text style={styles.iconText}>{dest.icon}</Text>
                {dest.badgeCount && dest.badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {dest.badgeCount > 99 ? '99+' : dest.badgeCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {dest.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export interface SealLayoutProps {
  children: React.ReactNode;
  activeDestination: NavDestination;
  onSelectDestination: (destination: NavDestination) => void;
  showNavBar?: boolean;
  style?: ViewStyle;
}

export const SealLayout: React.FC<SealLayoutProps> = ({
  children,
  activeDestination,
  onSelectDestination,
  showNavBar = true,
  style,
}) => {
  return (
    <SafeAreaView style={[styles.layoutContainer, style]}>
      <View style={styles.contentArea}>{children}</View>
      {showNavBar && (
        <SealNavigationBar
          activeDestination={activeDestination}
          onSelectDestination={onSelectDestination}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    backgroundColor: sealColors.background,
  },
  contentArea: {
    flex: 1,
  },
  navBarContainer: {
    backgroundColor: sealColors.surface,
    borderTopWidth: 1,
    borderTopColor: sealColors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconIndicator: {
    width: 64,
    height: 32,
    borderRadius: sealRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
    position: 'relative',
  },
  iconIndicatorActive: {
    backgroundColor: sealColors.primaryContainer,
  },
  iconText: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 14,
    backgroundColor: sealColors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: sealColors.onPrimary,
    fontSize: 10,
    fontWeight: sealTypography.weights.bold,
  },
  label: {
    fontSize: sealTypography.sizes.caption,
    fontWeight: sealTypography.weights.medium,
  },
  labelActive: {
    color: sealColors.onPrimaryContainer,
    fontWeight: sealTypography.weights.bold,
  },
  labelInactive: {
    color: sealColors.textSecondary,
  },
});

export default SealNavigationBar;
