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

interface CustomErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  errorDetail?: string | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

// oklch(0.66 0.16 252) -> Electric Royal Blue #0B4DDE
const PRIMARY_COLOR = '#0B4DDE';

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

          {/* Custom Themed Action Buttons */}
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
    backgroundColor: 'rgba(9, 9, 11, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272A',
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
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    marginBottom: 14,
  },
  errorTagIcon: {
    fontSize: 12,
  },
  errorTagText: {
    color: '#FF5252',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FAFAFA',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  messageText: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailBox: {
    maxHeight: 100,
    backgroundColor: '#09090B',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 20,
  },
  detailText: {
    fontSize: 12,
    color: '#FF5252',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retryButton: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dismissButtonPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dismissButtonSecondary: {
    flex: 1,
    backgroundColor: '#19191E',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissTextSecondary: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
});
