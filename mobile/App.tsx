import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { DisclaimerModal } from './src/components/DisclaimerModal';
import { CustomErrorModal } from './src/components/CustomErrorModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getDisclaimerAcceptedAt } from './src/services/storage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null);

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

        {currentScreen === 'Home' && (
          <HomeScreen onAnalyze={handleAnalyze} error={analyzeError} />
        )}

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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
});
