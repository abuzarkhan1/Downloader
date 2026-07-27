import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform as RNPlatform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NavTab = 'Home' | 'Downloads' | 'History';

interface NavigationBarProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
  downloadBadgeCount?: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabPress,
  downloadBadgeCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 16);

  const tabs: Array<{ id: NavTab; label: string; activeIcon: keyof typeof Ionicons.glyphMap; inactiveIcon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'Home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { id: 'Downloads', label: 'Downloads', activeIcon: 'arrow-down-circle', inactiveIcon: 'arrow-down-circle-outline' },
    { id: 'History', label: 'History', activeIcon: 'time', inactiveIcon: 'time-outline' },
  ];

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomOffset }]} pointerEvents="box-none" testID="iphone-nav-bar">
      <View style={styles.navContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
              testID={`nav-tab-${tab.id.toLowerCase()}`}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={22}
                  color={isActive ? Colors.white : Colors.textSecondary}
                />
                {tab.id === 'Downloads' && downloadBadgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {downloadBadgeCount > 99 ? '99+' : downloadBadgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
                {tab.label}
              </Text>

              {/* Active glow dot matching iOS design */}
              {isActive && <View style={styles.activeGlowDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: RNPlatform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(20, 20, 20, 0.92)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.dividerColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 380,
    // Modern iOS Shadow / Glassmorphic Elevation
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.white,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  activeGlowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.white,
    marginTop: 3,
  },
});
