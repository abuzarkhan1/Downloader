import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform as RNPlatform,
} from 'react-native';
import { sealColors, sealRadii, sealTypography } from '../theme/sealTheme';

interface CustomErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  errorDetail?: string | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

export const CustomErrorModal: React.FC<CustomErrorModalProps> = ({
  visible,
  title = 'Processing Error',
  message,
  errorDetail,
  onDismiss,
  onRetry,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
      testID="custom-error-modal"
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Status Header Badge */}
          <View style={styles.errorTag}>
            <Text style={styles.errorTagIcon}>⚠️</Text>
            <Text style={styles.errorTagText}>Error Encountered</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          {errorDetail && (
            <ScrollView style={styles.detailBox} showsVerticalScrollIndicator={false}>
              <Text style={styles.detailText}>{errorDetail}</Text>
            </ScrollView>
          )}

          {/* Custom MD3 Themed Action Buttons */}
          <View style={styles.actionRow}>
            {onRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                activeOpacity={0.85}
                testID="modal-retry-btn"
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={onRetry ? styles.dismissButtonSecondary : styles.dismissButtonPrimary}
              onPress={onDismiss}
              activeOpacity={0.8}
              testID="modal-dismiss-btn"
            >
              <Text style={onRetry ? styles.dismissTextSecondary : styles.dismissTextPrimary}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
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
    borderRadius: sealRadii.xl, // MD3 24dp card radius
    padding: 24,
    borderWidth: 1,
    borderColor: sealColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  errorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: sealColors.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(255, 84, 73, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: sealRadii.sm,
    gap: 6,
    marginBottom: 14,
  },
  errorTagIcon: {
    fontSize: 12,
  },
  errorTagText: {
    color: sealColors.onErrorContainer,
    fontSize: 11,
    fontWeight: sealTypography.weights.bold,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  title: {
    fontSize: sealTypography.sizes.subheading + 2,
    fontWeight: sealTypography.weights.bold,
    color: sealColors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  messageText: {
    fontSize: sealTypography.sizes.body,
    color: sealColors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailBox: {
    maxHeight: 100,
    backgroundColor: sealColors.background,
    borderRadius: sealRadii.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: sealColors.border,
    marginBottom: 20,
  },
  detailText: {
    fontSize: sealTypography.sizes.caption,
    color: sealColors.error,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retryButton: {
    flex: 1,
    backgroundColor: sealColors.primary,
    borderRadius: sealRadii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: sealColors.onPrimary,
    fontSize: sealTypography.sizes.body,
    fontWeight: sealTypography.weights.bold,
  },
  dismissButtonPrimary: {
    flex: 1,
    backgroundColor: sealColors.primary,
    borderRadius: sealRadii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissTextPrimary: {
    color: sealColors.onPrimary,
    fontSize: sealTypography.sizes.body,
    fontWeight: sealTypography.weights.bold,
  },
  dismissButtonSecondary: {
    flex: 1,
    backgroundColor: sealColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: sealColors.border,
    borderRadius: sealRadii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissTextSecondary: {
    color: sealColors.textPrimary,
    fontSize: sealTypography.sizes.body,
    fontWeight: sealTypography.weights.semibold,
  },
});
