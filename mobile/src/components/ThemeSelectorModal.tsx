import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, ThemeAccent } from '../store/useAppStore';
import { Colors } from '../theme/theme';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const THEMES: { label: ThemeAccent; color: string }[] = [
  { label: 'Midnight Neon', color: '#6A5ACD' }, // Example colors
  { label: 'Cyberpunk', color: '#FF007F' },
  { label: 'Emerald Dark', color: '#00C957' },
  { label: 'OLED Deep Blue', color: '#00008B' },
];

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, onClose }) => {
  const { currentThemeAccent, setCurrentThemeAccent } = useAppStore();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Select Theme Accent</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.themeList}>
                {THEMES.map((theme) => {
                  const isSelected = currentThemeAccent === theme.label;
                  return (
                    <TouchableOpacity
                      key={theme.label}
                      style={[
                        styles.themeItem,
                        isSelected && styles.themeItemSelected,
                        { borderColor: isSelected ? theme.color : Colors.glassBorder }
                      ]}
                      onPress={() => {
                        setCurrentThemeAccent(theme.label);
                        onClose();
                      }}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: theme.color }]} />
                      <Text style={[styles.themeLabel, isSelected && { color: theme.color }]}>
                        {theme.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  themeList: {
    gap: 12,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.surfaceInput,
  },
  themeItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  themeLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
