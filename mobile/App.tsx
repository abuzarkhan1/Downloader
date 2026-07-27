import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenName, AnalyzeResponse, DownloadStatusResponse } from './src/types';
import {
  analyzeUrl,
  startDownload,
  getDownloadStatus,
  cancelDownload,
  downloadAndSaveMedia,
} from './src/services/api';
import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { DownloadScreen } from './src/screens/DownloadScreen';
import { DownloadsScreen } from './src/screens/DownloadsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { DisclaimerModal } from './src/components/DisclaimerModal';
import { CustomErrorModal } from './src/components/CustomErrorModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { QuickShareSheet } from './src/components/QuickShareSheet';
import { NavigationBar, NavTab } from './src/components/NavigationBar';
import { getInitialShareUrl, subscribeToShareIntents } from './src/services/shareIntent';
import { getDisclaimerAcceptedAt } from './src/services/storage';
import { addHistoryItem } from './src/services/historyStorage';
import { I18nProvider } from './src/i18n/I18nContext';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
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
    status: 'ready',
    progress_percent: 0,
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDownloadingFileRef = useRef<boolean>(false);

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
  const handleAnalyze = async (url: string, removeWatermark?: boolean) => {
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

  // Direct download flow from QuickShareSheet bottom sheet
  const handleDirectDownloadFromSheet = async (
    url: string,
    formatType: 'video' | 'audio',
    quality: string
  ) => {
    setTargetUrl(url);
    setAnalyzeError(null);
    setCurrentScreen('Loading');

    try {
      const data = await analyzeUrl(url);
      setAnalyzeData(data);
      setSelectedFormatType(formatType);
      setSelectedQuality(quality);
      setDownloadStatus({ status: 'processing', progress_percent: 5 });
      setCurrentScreen('Download');
      isDownloadingFileRef.current = false;

      const job = await startDownload(data.id, formatType, quality);
      setDownloadJobId(job.download_job_id);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        if (isDownloadingFileRef.current) return;

        try {
          const status = await getDownloadStatus(job.download_job_id);

          if (status.status === 'ready') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            isDownloadingFileRef.current = true;

            setDownloadStatus({
              ...status,
              status: 'processing',
              progress_percent: 95,
            });

            let localUri = status.file_url;
            if (status.file_url) {
              try {
                const ext = formatType === 'audio' ? 'mp3' : 'mp4';
                const safeTitle = data.title ? data.title.replace(/[^a-zA-Z0-9._-]/g, '_') : 'media';
                const filename = `${safeTitle}_${quality}.${ext}`;
                localUri = await downloadAndSaveMedia(status.file_url, filename);
              } catch (dlErr) {
                console.warn('Error downloading media to device storage:', dlErr);
              }
            }

            const finalStatus: DownloadStatusResponse = {
              status: 'ready',
              progress_percent: 100,
              file_url: status.file_url,
              local_uri: localUri,
            };

            setDownloadStatus(finalStatus);

            await addHistoryItem({
              title: data.title,
              url,
              platform: data.platform,
              quality,
              formatType,
              fileSizeMb: 24.5,
              localPath: localUri || status.file_url,
              thumbnailUrl: data.thumbnail,
            });
          } else if (status.status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setDownloadStatus(status);
          } else {
            setDownloadStatus(status);
          }
        } catch (e) {
          // Resilience during polling
        }
      }, 800);
    } catch (err: any) {
      const msg = err.message || 'An error occurred while analyzing or downloading.';
      setAnalyzeError(msg);
      setCurrentScreen('Home');
      showError('Download Failed', msg);
    }
  };

  // Handle format selection & download start from Results screen
  const handleSelectFormat = async (formatType: 'video' | 'audio', quality: string) => {
    if (!analyzeData) return;

    setSelectedFormatType(formatType);
    setSelectedQuality(quality);
    setDownloadStatus({ status: 'processing', progress_percent: 5 });
    setCurrentScreen('Download');
    isDownloadingFileRef.current = false;

    try {
      const job = await startDownload(analyzeData.id, formatType, quality);
      setDownloadJobId(job.download_job_id);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        if (isDownloadingFileRef.current) return;

        try {
          const status = await getDownloadStatus(job.download_job_id);

          if (status.status === 'ready') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            isDownloadingFileRef.current = true;

            setDownloadStatus({
              ...status,
              status: 'processing',
              progress_percent: 95,
            });

            let localUri = status.file_url;
            if (status.file_url) {
              try {
                const ext = formatType === 'audio' ? 'mp3' : 'mp4';
                const safeTitle = analyzeData.title ? analyzeData.title.replace(/[^a-zA-Z0-9._-]/g, '_') : 'media';
                const filename = `${safeTitle}_${quality}.${ext}`;
                localUri = await downloadAndSaveMedia(status.file_url, filename);
              } catch (dlErr) {
                console.warn('Error downloading media to device storage:', dlErr);
              }
            }

            const finalStatus: DownloadStatusResponse = {
              status: 'ready',
              progress_percent: 100,
              file_url: status.file_url,
              local_uri: localUri,
            };

            setDownloadStatus(finalStatus);

            await addHistoryItem({
              title: analyzeData.title,
              url: targetUrl,
              platform: analyzeData.platform,
              quality,
              formatType,
              fileSizeMb: 24.5,
              localPath: localUri || status.file_url,
              thumbnailUrl: analyzeData.thumbnail,
            });
          } else if (status.status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setDownloadStatus(status);
          } else {
            setDownloadStatus(status);
          }
        } catch (e) {
          // Resilience
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
    isDownloadingFileRef.current = false;
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
    isDownloadingFileRef.current = false;
    setTargetUrl('');
    setAnalyzeData(null);
    setDownloadJobId(null);
    setAnalyzeError(null);
    setCurrentScreen('Home');
  };

  // Active Tab Mapping
  const getActiveTab = (): NavTab => {
    if (currentScreen === 'Downloads' || currentScreen === 'Download') return 'Downloads';
    if (currentScreen === 'History') return 'History';
    return 'Home';
  };

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ErrorBoundary>
          <View style={styles.container}>
            {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}
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
              onOpenMainApp={() => {
                setQuickShareVisible(false);
                if (quickShareUrl) handleAnalyze(quickShareUrl);
              }}
              onAnalyze={(url: string) => {
                setQuickShareVisible(false);
                handleAnalyze(url);
              }}
              onSelectFormat={(formatType: string, quality: string) => {
                setQuickShareVisible(false);
                if (quickShareUrl) {
                  handleDirectDownloadFromSheet(quickShareUrl, formatType as any, quality);
                }
              }}
            />

            {currentScreen === 'Home' && (
              <HomeScreen
                onAnalyze={handleAnalyze}
                onAutoDetectUrl={(url: string) => {
                  setQuickShareUrl(url);
                  setQuickShareVisible(true);
                }}
                error={analyzeError}
              />
            )}

            {currentScreen === 'Loading' && (
              <LoadingScreen />
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

            {currentScreen === 'Downloads' && (
              <DownloadsScreen
                activeDownloads={
                  analyzeData && downloadJobId
                    ? [
                        {
                          id: downloadJobId,
                          title: analyzeData.title,
                          platform: analyzeData.platform,
                          quality: selectedQuality,
                          formatType: selectedFormatType,
                          progressPercent: downloadStatus.progress_percent,
                          status: downloadStatus.status,
                          localPath: downloadStatus.local_uri || downloadStatus.file_url,
                          fileSizeMb: 24.5,
                        },
                      ]
                    : []
                }
                onCancelDownload={handleCancelDownload}
                onNavigateHome={() => setCurrentScreen('Home')}
              />
            )}

            {currentScreen === 'History' && (
              <HistoryScreen
                onNavigateHome={() => setCurrentScreen('Home')}
              />
            )}

            {/* Floating Glassmorphic Bottom Navigation Bar */}
            {!showSplash && (
              <NavigationBar
                activeTab={getActiveTab()}
                onTabPress={(tab) => {
                  if (tab === 'Home') {
                    setCurrentScreen('Home');
                  } else if (tab === 'Downloads') {
                    setCurrentScreen('Downloads');
                  } else if (tab === 'History') {
                    setCurrentScreen('History');
                  }
                }}
                downloadBadgeCount={
                  downloadJobId !== null &&
                  (downloadStatus.status === 'processing' || downloadStatus.status === 'queued')
                    ? 1
                    : 0
                }
              />
            )}
          </View>
        </ErrorBoundary>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
