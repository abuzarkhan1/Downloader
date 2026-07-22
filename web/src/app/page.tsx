"use client";

import React, { useState } from "react";
import { HomeScreen, LoadingScreen, ResultsScreen, DownloadScreen } from "@/components/screens";
import { DisclaimerModal, CustomErrorModal } from "@/components";
import { MediaMetadata, FormatOption } from "@/types";
import apiClient, { AnalyzeResponse, startDownload } from "@/services/api";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"home" | "loading" | "results" | "download">("home");
  const [mediaData, setMediaData] = useState<MediaMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);

  // Disclaimer Modal state (shows on first visit or when user clicks Disclaimer in footer)
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

    let platformType: "youtube" | "tiktok" | "instagram" | "facebook" | "other" = "other";
    const lowerPlatform = (res.platform || "").toLowerCase();
    if (lowerPlatform.includes("youtube")) platformType = "youtube";
    else if (lowerPlatform.includes("tiktok")) platformType = "tiktok";
    else if (lowerPlatform.includes("instagram")) platformType = "instagram";
    else if (lowerPlatform.includes("facebook")) platformType = "facebook";

    return {
      id: res.id,
      title: res.title || "Untitled Video",
      uploader: res.uploader || "Unknown Uploader",
      thumbnailUrl: res.thumbnail || "",
      duration: formatDuration(res.duration_seconds || 0),
      platform: platformType,
      formats: [...videoFormatOptions, ...audioFormatOptions],
    };
  };

  // Handle URL analyze action
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
  };

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
              <span>VideoDownloader</span>
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold uppercase rounded bg-[#0B4DDE]/20 text-[#0B4DDE] border border-[#0B4DDE]/30">
                Web
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">Universal Media Extractor</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDisclaimerOpen(true)}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#09090B] hover:bg-zinc-800 transition-colors"
          >
            Disclaimer
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
          />
        )}

        {currentStep === "loading" && (
          <LoadingScreen
            statusMessage="Analyzing media URL and retrieving available format qualities..."
            onCancel={handleReset}
          />
        )}

        {currentStep === "results" && mediaData && (
          <ResultsScreen
            media={mediaData}
            onDownload={handleStartDownload}
            onReset={handleReset}
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
        <p>© 2026 Universal VideoDownloader Web. All media processed temporarily without permanent storage.</p>
        <div className="flex justify-center gap-4 text-zinc-400">
          <button type="button" onClick={() => setDisclaimerOpen(true)} className="hover:underline">
            Legal Disclaimer & Terms
          </button>
        </div>
      </footer>
    </div>
  );
}
