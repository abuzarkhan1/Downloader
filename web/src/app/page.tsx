"use client";

import React, { useState, useEffect } from "react";
import {
  HomeScreen,
  LoadingScreen,
  ResultsScreen,
  DownloadScreen,
  HistoryScreen,
  CommandsScreen,
  SettingsScreen,
} from "@/components/screens";
import { DisclaimerModal, CustomErrorModal } from "@/components";
import { MediaMetadata, FormatOption } from "@/types";
import apiClient, {
  AnalyzeResponse,
  startDownload,
  DownloadRequestPayload,
} from "@/services/api";
import { saveHistoryItem, DownloadHistoryItem } from "@/services/historyStorage";
import { getSettings, UserSettings } from "@/services/settingsStorage";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "history" | "commands" | "settings">("home");
  const [currentStep, setCurrentStep] = useState<"home" | "loading" | "results" | "download">("home");

  const [mediaData, setMediaData] = useState<MediaMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [downloadJobId, setDownloadJobId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState<boolean>(false);

  // Read settings
  const [userSettings, setUserSettings] = useState<UserSettings>(getSettings());

  useEffect(() => {
    setUserSettings(getSettings());
  }, [activeTab]);

  // Helper to format duration in seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const pad = (num: number) => num.toString().padStart(2, "0");
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${mins}:${pad(secs)}`;
  };

  // Map AnalyzeResponse to MediaMetadata schema
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
      extension: f.ext || userSettings.audioCodec || "mp3",
      filesize: f.filesize_mb ? `${f.filesize_mb.toFixed(1)} MB` : "Unknown size",
      isAudio: true,
      bitrate: f.quality || userSettings.audioBitrate,
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
    setActiveTab("home");
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
  const handleStartDownload = async (format: FormatOption, extraOptions?: Record<string, any>) => {
    if (!mediaData) return;

    setSelectedFormat(format);
    setIsLoading(true);
    setErrorMessage(null);

    const formatType = format.isAudio ? "audio" : "video";

    const payload: DownloadRequestPayload = {
      id: mediaData.id,
      format_type: formatType,
      quality: format.quality,
      remux_mkv: extraOptions?.remux_mkv ?? userSettings.remuxMkv,
      crop_artwork: userSettings.cropArtwork,
      embed_subtitles: extraOptions?.embed_subtitles ?? userSettings.embedSubtitles,
      cookies_str: userSettings.netscapeCookies || undefined,
      proxy_url: userSettings.proxyUrl || undefined,
      start_time: extraOptions?.start_time,
      end_time: extraOptions?.end_time,
      max_filesize: userSettings.maxFilesize || undefined,
      rate_limit: userSettings.rateLimit || undefined,
      restrict_filenames: userSettings.restrictFilenames,
      force_ipv4: userSettings.forceIpv4,
      output_template: userSettings.outputTemplate,
      audio_codec: extraOptions?.audio_codec || userSettings.audioCodec,
      audio_bitrate: extraOptions?.audio_bitrate || userSettings.audioBitrate,
      sponsorblock_remove: extraOptions?.sponsorblock_remove ?? userSettings.sponsorblockRemove,
    };

    try {
      const response = await startDownload(payload);
      setDownloadJobId(response.download_job_id);

      // Save initial record to local storage history
      saveHistoryItem({
        id: response.download_job_id,
        mediaId: mediaData.id,
        title: mediaData.title,
        thumbnailUrl: mediaData.thumbnailUrl,
        uploader: mediaData.uploader,
        platform: mediaData.platform || "other",
        formatType,
        quality: format.quality,
        extension: format.extension,
        filesize: format.filesize,
        status: "Processing",
      });

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
    setActiveTab("home");
    setCurrentStep("home");
    setMediaData(null);
    setSelectedFormat(null);
    setDownloadJobId(null);
    setErrorMessage(null);
  };

  const handleReDownload = (item: DownloadHistoryItem) => {
    if (item.url) {
      handleAnalyzeUrl(item.url);
    } else {
      setActiveTab("home");
      setCurrentStep("home");
    }
  };

  return (
    <div
      className={`min-h-screen ${
        userSettings.oledDarkMode ? "bg-[#000000]" : "bg-[#09090B]"
      } text-zinc-100 flex flex-col justify-between font-sans selection:bg-[#A3D48D] selection:text-black pb-16 sm:pb-0`}
    >
      {/* Top Application Header */}
      <header className="w-full border-b border-[#27272A] bg-[#121215]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Logo Branding */}
        <div
          onClick={handleReset}
          className="flex items-center gap-3 cursor-pointer group transition-opacity hover:opacity-90"
        >
          <div className="w-9 h-9 rounded-xl bg-[#A3D48D] flex items-center justify-center text-black font-extrabold text-lg shadow-lg shadow-[#A3D48D]/30 group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>VideoDownloader</span>
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold uppercase rounded bg-[#A3D48D]/20 text-[#A3D48D] border border-[#A3D48D]/30">
                Seal MD3
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">Universal Media Extractor</p>
          </div>
        </div>

        {/* Desktop Top Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#09090B] border border-[#27272A] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("home");
              if (!mediaData) setCurrentStep("home");
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "home"
                ? "bg-[#A3D48D] text-black font-bold shadow-md shadow-[#A3D48D]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[#A3D48D] text-black font-bold shadow-md shadow-[#A3D48D]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("commands")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "commands"
                ? "bg-[#A3D48D] text-black font-bold shadow-md shadow-[#A3D48D]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Commands</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#A3D48D] text-black font-bold shadow-md shadow-[#A3D48D]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>

        {/* Disclaimer button */}
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
        {activeTab === "home" && (
          <>
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
          </>
        )}

        {activeTab === "history" && (
          <HistoryScreen
            onReDownload={handleReDownload}
            onNavigateHome={() => setActiveTab("home")}
          />
        )}

        {activeTab === "commands" && (
          <CommandsScreen
            onExecuteCommand={(flags) => {
              console.log("Execute custom flags:", flags);
              setActiveTab("home");
            }}
          />
        )}

        {activeTab === "settings" && (
          <SettingsScreen
            onSettingsChanged={(newSettings) => setUserSettings(newSettings)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121215]/95 backdrop-blur-md border-t border-[#27272A] px-4 py-2 flex items-center justify-around">
        <button
          type="button"
          onClick={() => {
            setActiveTab("home");
            if (!mediaData) setCurrentStep("home");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
            activeTab === "home" ? "text-[#A3D48D]" : "text-zinc-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
            activeTab === "history" ? "text-[#A3D48D]" : "text-zinc-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("commands")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
            activeTab === "commands" ? "text-[#A3D48D]" : "text-zinc-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Commands</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
            activeTab === "settings" ? "text-[#A3D48D]" : "text-zinc-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>

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
