import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ScreenName, AnalyzeResponse, DownloadStatusResponse } from './src/types';
import {
  analyzeUrl,
  startDownload,
  getDownloadStatus,
  cancelDownload,
} from './src/services/api';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { DownloadScreen } from './src/screens/DownloadScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CommandTemplatesScreen } from './src/screens/CommandTemplatesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DisclaimerModal } from './src/components/DisclaimerModal';
import { CustomErrorModal } from './src/components/CustomErrorModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { QuickShareSheet } from './src/components/QuickShareSheet';
import { getInitialShareUrl, subscribeToShareIntents } from './src/services/shareIntent';
import { getDisclaimerAcceptedAt } from './src/services/storage';

const LIME_ACCENT = '#A3D48D';
const DARK_BG = '#1B1C18';
const SURFACE_BG = '#23241F';
const BORDER_COLOR = '#3F4139';
const SUBTEXT_COLOR = '#C7C8BE';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null);

  // Quick Share Intent state
  const [quickShareVisible, setQuickShareVisible] = useState(false);
  const [quickShareUrl, setQuickShareUrl] = useState('');

  // Global custom error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Error');
  const [errorModalMsg, setErrorModalMsg] = useState('');
  const [errorModalDetail, setErrorModalDetail] = useState<string | null>(null);

  // Check disclaimer acceptance status on app mount
  useEffect(() => {
    async function checkDisclaimer() {
      const acceptedAt = await getDisclaimerAcceptedAt();
      if (acceptedAt) {
        setDisclaimerAccepted(true);
      }
    }
    checkDisclaimer();
  }, []);

  // Handle initial and background incoming share intents
  useEffect(() => {
    let isMounted = true;

    async function checkInitialShare() {
      const url = await getInitialShareUrl();
      if (url && isMounted) {
        setQuickShareUrl(url);
        setQuickShareVisible(true);
      }
    }
    checkInitialShare();

    const unsubscribe = subscribeToShareIntents((url: string) => {
      if (isMounted && url) {
        setQuickShareUrl(url);
        setQuickShareVisible(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Download state
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);
  const [selectedFormatType, setSelectedFormatType] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatusResponse>({
    status: 'processing',
    progress_percent: 0,
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const showError = (title: string, message: string, detail?: string | null) => {
    setErrorModalTitle(title);
    setErrorModalMsg(message);
    setErrorModalDetail(detail || null);
    setErrorModalVisible(true);
  };

  // Handle link analysis
  const handleAnalyze = async (url: string) => {
    setTargetUrl(url);
    setAnalyzeError(null);
    setCurrentScreen('Loading');

    try {
      const data = await analyzeUrl(url);
      setAnalyzeData(data);
      setCurrentScreen('Results');
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred while analyzing the link.';
      setAnalyzeError(msg);
      setCurrentScreen('Home');
      showError('Analysis Failed', msg, err.error_code ? `Error Code: ${err.error_code}` : null);
    }
  };

  // Handle format selection & download start
  const handleSelectFormat = async (formatType: 'video' | 'audio', quality: string) => {
    if (!analyzeData) return;

    setSelectedFormatType(formatType);
    setSelectedQuality(quality);
    setDownloadStatus({ status: 'processing', progress_percent: 5 });
    setCurrentScreen('Download');

    try {
      const job = await startDownload(analyzeData.id, formatType, quality);
      setDownloadJobId(job.download_job_id);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await getDownloadStatus(job.download_job_id);
          setDownloadStatus(status);

          if (status.status === 'ready' || status.status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (e) {
          // Resilience during polling
        }
      }, 800);
    } catch (err: any) {
      const msg = err.message || 'Could not initiate download job.';
      setDownloadStatus({
        status: 'failed',
        progress_percent: 0,
        error_message: msg,
      });
      showError('Download Failed', msg);
    }
  };

  // Handle download cancellation
  const handleCancelDownload = async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (downloadJobId) {
      await cancelDownload(downloadJobId);
    }
    setCurrentScreen('Results');
  };

  // Reset to Home
  const handleResetToHome = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setTargetUrl('');
    setAnalyzeData(null);
    setDownloadJobId(null);
    setAnalyzeError(null);
    setCurrentScreen('Home');
  };

  // Check if main tab bar should show
  const showTabBar = ['Home', 'History', 'Templates', 'Settings'].includes(currentScreen);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <DisclaimerModal
          visible={!disclaimerAccepted}
          onAccept={() => setDisclaimerAccepted(true)}
        />

        <CustomErrorModal
          visible={errorModalVisible}
          title={errorModalTitle}
          message={errorModalMsg}
          errorDetail={errorModalDetail}
          onDismiss={() => setErrorModalVisible(false)}
        />

        <QuickShareSheet
          visible={quickShareVisible}
          sharedUrl={quickShareUrl}
          onClose={() => setQuickShareVisible(false)}
          onOpenMainApp={() => setQuickShareVisible(false)}
          onAnalyze={(url: string) => {
            setQuickShareVisible(false);
            handleAnalyze(url);
          }}
        />

        <View style={styles.screenContent}>
          {currentScreen === 'Home' && (
            <HomeScreen onAnalyze={handleAnalyze} error={analyzeError} />
          )}

          {currentScreen === 'History' && (
            <HistoryScreen
              onRedownload={(item) => handleAnalyze(item.url || '')}
              onBackToHome={() => setCurrentScreen('Home')}
            />
          )}

          {currentScreen === 'Templates' && (
            <CommandTemplatesScreen
              onExecuteTemplate={(flags) => {
                showError('CLI Template Selected', `Flags set:\n${flags}`);
              }}
            />
          )}

          {currentScreen === 'Settings' && <SettingsScreen />}

          {currentScreen === 'Loading' && (
            <LoadingScreen message="Analyzing media link..." />
          )}

          {currentScreen === 'Results' && analyzeData && (
            <ResultsScreen
              data={analyzeData}
              onSelectFormat={handleSelectFormat}
              onBack={handleResetToHome}
            />
          )}

          {currentScreen === 'Download' && analyzeData && (
            <DownloadScreen
              downloadJobId={downloadJobId}
              statusData={downloadStatus}
              selectedQuality={selectedQuality}
              formatType={selectedFormatType}
              title={analyzeData.title}
              onCancel={handleCancelDownload}
              onDownloadAnother={handleResetToHome}
            />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        {showTabBar && (
          <SafeAreaView style={styles.bottomNavContainer}>
            <View style={styles.bottomNavBar}>
              <TouchableOpacity
                style={[styles.navTab, currentScreen === 'Home' && styles.navTabActive]}
                onPress={() => setCurrentScreen('Home')}
                activeOpacity={0.8}
                testID="nav-tab-home"
              >
                <Text style={styles.navIcon}>🏠</Text>
                <Text style={[styles.navLabel, currentScreen === 'Home' && styles.navLabelActive]}>
                  Search
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navTab, currentScreen === 'History' && styles.navTabActive]}
                onPress={() => setCurrentScreen('History')}
                activeOpacity={0.8}
                testID="nav-tab-history"
              >
                <Text style={styles.navIcon}>📜</Text>
                <Text style={[styles.navLabel, currentScreen === 'History' && styles.navLabelActive]}>
                  History
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navTab, currentScreen === 'Templates' && styles.navTabActive]}
                onPress={() => setCurrentScreen('Templates')}
                activeOpacity={0.8}
                testID="nav-tab-templates"
              >
                <Text style={styles.navIcon}>⚡</Text>
                <Text style={[styles.navLabel, currentScreen === 'Templates' && styles.navLabelActive]}>
                  Templates
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navTab, currentScreen === 'Settings' && styles.navTabActive]}
                onPress={() => setCurrentScreen('Settings')}
                activeOpacity={0.8}
                testID="nav-tab-settings"
              >
                <Text style={styles.navIcon}>⚙️</Text>
                <Text style={[styles.navLabel, currentScreen === 'Settings' && styles.navLabelActive]}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  screenContent: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: SURFACE_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  bottomNavBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  navTabActive: {
    backgroundColor: 'rgba(163, 212, 141, 0.15)',
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: SUBTEXT_COLOR,
  },
  navLabelActive: {
    color: LIME_ACCENT,
    fontWeight: '700',
  },
});
