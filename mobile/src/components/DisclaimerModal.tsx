import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { getDisclaimerAcceptedAt, saveDisclaimerAcceptedAt } from '../services/storage';
import { sealColors, sealRadii, sealTypography } from '../theme/sealTheme';

interface DisclaimerModalProps {
  visible?: boolean;
  onAccept?: (timestamp?: string) => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  visible: propVisible,
  onAccept,
}) => {
  const [visible, setVisible] = useState(propVisible !== undefined ? propVisible : false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (propVisible === undefined) {
      checkAcceptance();
    } else {
      setVisible(propVisible);
    }
  }, [propVisible]);

  const checkAcceptance = async () => {
    try {
      const value = await getDisclaimerAcceptedAt();
      if (!value) {
        setVisible(true);
      }
    } catch (e) {
      setVisible(true);
    }
  };

  const handleAccept = async () => {
    if (!isChecked) return;
    const nowISO = new Date().toISOString();
    try {
      await saveDisclaimerAcceptedAt(nowISO);
    } catch (e) {
      // ignore
    }
    setVisible(false);
    if (onAccept) onAccept(nowISO);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
      testID="disclaimer-modal"
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>
            Please review and accept our usage guidelines before continuing.
          </Text>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.bodyText}>
              By using Universal Media Downloader, you confirm that you will only download and archive media content that you own, or for which you have explicit authorization or legal rights to download.
            </Text>
            <Text style={styles.bodyText}>
              This service is intended solely for personal media archiving and authorized backup purposes. Unauthorized distribution of copyrighted material is strictly prohibited.
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsChecked(!isChecked)}
            activeOpacity={0.8}
            testID="disclaimer-checkbox"
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Text style={styles.checkmarkText}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree that I have permission to download this content.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, !isChecked && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={!isChecked}
            activeOpacity={0.85}
            testID="disclaimer-accept-btn"
          >
            <Text style={[styles.acceptButtonText, !isChecked && styles.acceptButtonTextDisabled]}>
              Continue to App
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 20, 14, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: sealColors.surfaceContainer,
    borderRadius: sealRadii.xl, // MD3 24dp radius
    padding: 24,
    borderWidth: 1,
    borderColor: sealColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: sealTypography.sizes.heading,
    fontWeight: sealTypography.weights.bold,
    color: sealColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: sealTypography.sizes.body,
    color: sealColors.textSecondary,
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 160,
    backgroundColor: sealColors.background,
    borderRadius: sealRadii.card, // MD3 16dp radius
    padding: 14,
    borderWidth: 1,
    borderColor: sealColors.border,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: sealTypography.sizes.body,
    color: sealColors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: sealColors.borderLight,
    backgroundColor: sealColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: sealColors.primary,
    borderColor: sealColors.primary,
  },
  checkmarkText: {
    color: sealColors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: sealTypography.sizes.body,
    color: sealColors.textPrimary,
    fontWeight: sealTypography.weights.medium,
  },
  acceptButton: {
    backgroundColor: sealColors.primary,
    borderRadius: sealRadii.pill,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: sealColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: sealColors.border,
  },
  acceptButtonText: {
    color: sealColors.onPrimary,
    fontSize: sealTypography.sizes.body,
    fontWeight: sealTypography.weights.bold,
  },
  acceptButtonTextDisabled: {
    color: sealColors.textMuted,
  },
});
