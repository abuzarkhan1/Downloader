import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

interface ErgonomicFabProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  label?: string;
}

export const ErgonomicFab: React.FC<ErgonomicFabProps> = ({ 
  onPress, 
  iconName = 'clipboard-outline',
  label = 'Paste' 
}) => {
  return (
    <TouchableOpacity 
      style={styles.fab} 
      onPress={onPress} 
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Double tap to trigger action"
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color={Colors.black} />
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: Colors.black,
    fontWeight: '700',
    fontSize: 15,
  }
});
