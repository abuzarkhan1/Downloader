import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform as RNPlatform,
} from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// oklch(0.66 0.16 252) -> Electric Royal Blue #0B4DDE
const PRIMARY_COLOR = '#0B4DDE';

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#09090B" />

          {/* Top Bar Header */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Media Downloader</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>APPLICATION ERROR</Text>
              </View>

              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.subtitle}>
                An unexpected component error occurred while rendering the interface.
              </Text>

              {this.state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} numberOfLines={4}>
                    {this.state.error.toString()}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.reloadButton}
                onPress={this.handleReload}
                activeOpacity={0.85}
              >
                <Text style={styles.reloadButtonText}>Reload Interface</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAFAFA',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  errorBadge: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorBadgeText: {
    color: '#FF5252',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#09090B',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 24,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    fontFamily: RNPlatform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  reloadButton: {
    width: '100%',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
