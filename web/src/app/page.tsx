"use client";

import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { HomeScreen, LoadingScreen, ResultsScreen, DownloadScreen } from "@/components/screens";
import { DisclaimerModal, CustomErrorModal } from "@/components";
import { LanguageSelector } from "@/components/LanguageSelector";
import { MediaMetadata, FormatOption, BatchItem } from "@/types";
import apiClient, { AnalyzeResponse, startDownload } from "@/services/api";

function AppContent() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<"home" | "loading" | "results" | "download" | "batch">("home");
  const [mediaData, setMediaData] = useState<MediaMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);

  // TikTok / Shorts Watermark Removal Toggle (default ON)
  const [removeWatermark, setRemoveWatermark] = useState<boolean>(true);

  // Batch / Playlist Mode state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchDownloadingAll, setIsBatchDownloadingAll] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);

  // Disclaimer Modal state
  const [disclaimerOpen, setDisclaimerOpen] = useState<boolean>(false);

  // Helper to format duration in seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, "0");

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${mins}:${pad(secs)}`;
  };

  // Convert AnalyzeResponse to MediaMetadata schema
  const mapAnalyzeResponseToMediaMetadata = (res: AnalyzeResponse): MediaMetadata => {
    const videoFormatOptions: FormatOption[] = (res.video_formats || []).map((f, i) => ({
      id: `${res.id}_v_${i}_${f.quality}`,
      quality: f.quality,
      extension: f.ext || "mp4",
      filesize: f.filesize_mb ? `${f.filesize_mb.toFixed(1)} MB` : "Unknown size",
      isAudio: false,
      fps: f.fps,
    }));

    const audioFormatOptions: FormatOption[] = (res.audio_formats || []).map((f, i) => ({
      id: `${res.id}_a_${i}_${f.quality}`,
      quality: f.quality,
      extension: f.ext || "mp3",
      filesize: f.filesize_mb ? `${f.filesize_mb.toFixed(1)} MB` : "Unknown size",
      isAudio: true,
      bitrate: f.quality,
    }));

    let platformType: "youtube" | "tiktok" | "instagram" | "facebook" | "twitter" | "other" = "other";
    const lowerPlatform = (res.platform || "").toLowerCase();
    if (lowerPlatform.includes("youtube")) platformType = "youtube";
    else if (lowerPlatform.includes("tiktok")) platformType = "tiktok";
    else if (lowerPlatform.includes("instagram")) platformType = "instagram";
    else if (lowerPlatform.includes("facebook")) platformType = "facebook";
    else if (lowerPlatform.includes("twitter") || lowerPlatform.includes("x")) platformType = "twitter";

    return {
      id: res.id,
      title: res.title || "Untitled Video",
      uploader: res.uploader || "Unknown Uploader",
      thumbnailUrl: res.thumbnail || "",
      duration: formatDuration(res.duration_seconds || 0),
      platform: platformType,
      formats: [...videoFormatOptions, ...audioFormatOptions],
      subtitles: res.subtitles,
    };
  };

  // Handle single URL analyze action
  const handleAnalyzeUrl = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentStep("loading");

    try {
      const response = await apiClient.analyzeUrl(url);
      const mappedMedia = mapAnalyzeResponseToMediaMetadata(response);
      setMediaData(mappedMedia);
      setCurrentStep("results");
    } catch (err: unknown) {
      console.error("Analyze URL error:", err);
      const msg = err instanceof Error ? err.message : "Failed to analyze link. Please check the URL and try again.";
      setErrorMessage(msg);
      setErrorModalOpen(true);
      setCurrentStep("home");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle batch URLs analysis
  const handleBatchAnalyze = async (urls: string[]) => {
    const initialItems: BatchItem[] = urls.map((url, index) => ({
      id: `batch_${Date.now()}_${index}`,
      url,
      status: "pending",
    }));
    setBatchItems(initialItems);
    setCurrentStep("batch");

    for (let i = 0; i < initialItems.length; i++) {
      const item = initialItems[i];
      setBatchItems((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: "analyzing" } : b))
      );
      try {
        const res = await apiClient.analyzeUrl(item.url);
        const media = mapAnalyzeResponseToMediaMetadata(res);
        setBatchItems((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, status: "ready", media } : b))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to analyze link";
        setBatchItems((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, status: "failed", error: msg } : b))
        );
      }
    }
  };

  const handleBatchItemDownload = async (item: BatchItem) => {
    if (!item.media || item.media.formats.length === 0) return;
    const bestFormat = item.media.formats[0];
    const formatType = bestFormat.isAudio ? "audio" : "video";

    setBatchItems((prev) =>
      prev.map((b) => (b.id === item.id ? { ...b, status: "downloading", progressPercent: 30 } : b))
    );

    try {
      const response = await startDownload(item.media.id, formatType, bestFormat.quality);
      setBatchItems((prev) =>
        prev.map((b) =>
          b.id === item.id
            ? { ...b, status: "completed", downloadJobId: response.download_job_id, progressPercent: 100 }
            : b
        )
      );

      // Trigger native download anchor
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const fileUrl = `${API_BASE_URL}/api/v1/files/${response.download_job_id}`;
      const safeTitle = item.media.title.replace(/[^a-z0-9_\-]/gi, "_").substring(0, 40);
      const filename = `${safeTitle}.${bestFormat.extension || "mp4"}`;

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setBatchItems((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: "failed", error: "Download failed" } : b))
      );
    }
  };

  const handleDownloadAllBatch = async () => {
    setIsBatchDownloadingAll(true);
    const readyItems = batchItems.filter((b) => b.status === "ready");
    for (const item of readyItems) {
      await handleBatchItemDownload(item);
    }
    setIsBatchDownloadingAll(false);
  };

  // Handle download format selection from ResultsScreen
  const handleStartDownload = async (format: FormatOption) => {
    if (!mediaData) return;

    setSelectedFormat(format);
    setIsLoading(true);
    setErrorMessage(null);

    const formatType = format.isAudio ? "audio" : "video";

    try {
      const response = await startDownload(mediaData.id, formatType, format.quality);
      setDownloadJobId(response.download_job_id);
      setCurrentStep("download");
    } catch (err: unknown) {
      console.error("Start download error:", err);
      const msg = err instanceof Error ? err.message : "Failed to start download job.";
      setErrorMessage(msg);
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset flow back to home search screen
  const handleReset = () => {
    setCurrentStep("home");
    setMediaData(null);
    setSelectedFormat(null);
    setDownloadJobId(null);
    setErrorMessage(null);
    setBatchItems([]);
  };

  const completedCount = batchItems.filter((b) => b.status === "completed" || b.status === "ready").length;

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between font-sans selection:bg-[#0B4DDE] selection:text-white">
      {/* Top Application Header */}
      <header className="w-full border-b border-[#27272A] bg-[#121215]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div
          onClick={handleReset}
          className="flex items-center gap-3 cursor-pointer group transition-opacity hover:opacity-90"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0B4DDE] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#0B4DDE]/30 group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{t("appName")}</span>
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold uppercase rounded bg-[#0B4DDE]/20 text-[#0B4DDE] border border-[#0B4DDE]/30">
                Web
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">{t("appSubtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector Header Component */}
          <LanguageSelector />

          <button
            type="button"
            onClick={() => setDisclaimerOpen(true)}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#09090B] hover:bg-zinc-800 transition-colors"
          >
            {t("disclaimer")}
          </button>
        </div>
      </header>

      {/* Main App Content Viewport */}
      <main className="flex-1 flex flex-col justify-center items-center py-6 px-4">
        {currentStep === "home" && (
          <HomeScreen
            analyzeUrl={handleAnalyzeUrl}
            isLoading={isLoading}
            errorMessage={errorMessage}
            removeWatermark={removeWatermark}
            onToggleWatermark={setRemoveWatermark}
            onBatchAnalyze={handleBatchAnalyze}
          />
        )}

        {currentStep === "loading" && (
          <LoadingScreen
            statusMessage={t("loadingMessage")}
            onCancel={handleReset}
          />
        )}

        {currentStep === "results" && mediaData && (
          <ResultsScreen
            media={mediaData}
            onDownload={handleStartDownload}
            onReset={handleReset}
            removeWatermark={removeWatermark}
            onToggleWatermark={setRemoveWatermark}
          />
        )}

        {currentStep === "download" && downloadJobId && (
          <DownloadScreen
            downloadJobId={downloadJobId}
            media={mediaData}
            selectedFormat={selectedFormat}
            onBackToSearch={handleReset}
            onReset={handleReset}
          />
        )}

        {/* BATCH DOWNLOADER RESULTS SCREEN */}
        {currentStep === "batch" && (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[70vh]">
            <div className="w-full flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white bg-[#121215] hover:bg-zinc-800 border border-[#27272A] rounded-xl transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{t("backToSearch")}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAllBatch}
                disabled={isBatchDownloadingAll || batchItems.filter((b) => b.status === "ready").length === 0}
                className="bg-[#0B4DDE] hover:bg-[#093ebd] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-[#0B4DDE]/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{isBatchDownloadingAll ? t("downloadingAll") : t("downloadAll")}</span>
              </button>
            </div>

            <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272A] pb-4 gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">{t("batchTitle")}</h2>
                  <p className="text-xs text-zinc-400">
                    {t("batchSubtitle", { completed: completedCount, total: batchItems.length })}
                  </p>
                </div>
                <div className="w-full sm:w-48 bg-[#09090B] border border-[#27272A] rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#0B4DDE] h-full transition-all duration-300"
                    style={{ width: `${(completedCount / Math.max(1, batchItems.length)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {batchItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[#121215] border border-[#27272A] flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                        #{index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate">
                          {item.media?.title || item.url}
                        </div>
                        <div className="text-xs text-zinc-500 truncate font-mono">{item.url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Status Badges */}
                      {item.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400">
                          {t("statusPending")}
                        </span>
                      )}
                      {item.status === "analyzing" && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                          {t("statusAnalyzing")}
                        </span>
                      )}
                      {item.status === "ready" && (
                        <button
                          type="button"
                          onClick={() => handleBatchItemDownload(item)}
                          className="px-3 py-1.5 bg-[#0B4DDE] hover:bg-[#093ebd] text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          {t("download")}
                        </button>
                      )}
                      {item.status === "downloading" && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          {t("statusDownloading")}
                        </span>
                      )}
                      {item.status === "completed" && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          ✓ {t("statusCompleted")}
                        </span>
                      )}
                      {item.status === "failed" && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          {t("statusFailed")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <DisclaimerModal
        forceOpen={disclaimerOpen}
        onAccept={() => setDisclaimerOpen(false)}
      />

      <CustomErrorModal
        isOpen={errorModalOpen}
        message={errorMessage || "An unexpected error occurred"}
        onClose={() => setErrorModalOpen(false)}
      />

      {/* Modern Dark Footer */}
      <footer className="w-full border-t border-[#27272A] bg-[#09090B] py-6 px-4 text-center text-xs text-zinc-500 space-y-2">
        <p>{t("copyright")}</p>
        <div className="flex justify-center gap-4 text-zinc-400">
          <button type="button" onClick={() => setDisclaimerOpen(true)} className="hover:underline">
            {t("legalDisclaimer")}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <AppContent />;
}
