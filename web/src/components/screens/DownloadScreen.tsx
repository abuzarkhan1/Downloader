"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DownloadScreenProps } from "@/types";
import { getDownloadStatus, DownloadStatusResponse } from "@/services/api";
import { updateHistoryItemStatus } from "@/services/historyStorage";

export const DownloadScreen: React.FC<DownloadScreenProps> = ({
  downloadJobId,
  media,
  selectedFormat,
  onBack,
  onReset,
  onBackToSearch,
  onComplete,
}) => {
  const [status, setStatus] = useState<"queued" | "processing" | "ready" | "failed">("queued");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTriggeringDownload, setIsTriggeringDownload] = useState<boolean>(false);
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const autoTriggeredRef = useRef<boolean>(false);

  const handleBackToSearch = () => {
    if (onBackToSearch) {
      onBackToSearch();
    } else if (onBack) {
      onBack();
    } else if (onReset) {
      onReset();
    }
  };

  // Browser-native media file download trigger
  const triggerNativeDownload = useCallback(
    async (targetFileUrl: string) => {
      if (!targetFileUrl) return;
      setIsTriggeringDownload(true);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      let fullUrl = targetFileUrl;
      if (targetFileUrl.startsWith("/")) {
        fullUrl = `${API_BASE_URL}${targetFileUrl}`;
      }

      // Generate clean filename
      const rawTitle = media?.title || "media_file";
      const safeTitle = rawTitle.replace(/[^a-z0-9_\-]/gi, "_").substring(0, 50);
      const ext = selectedFormat?.extension || (selectedFormat?.isAudio ? "mp3" : "mp4");
      const filename = `${safeTitle}.${ext}`;

      try {
        // Fetch direct blob for browser download dialog
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        setHasDownloaded(true);
      } catch (err) {
        console.warn("Direct blob download encountered issue, using fallback link:", err);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = fullUrl;
        a.download = filename;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setHasDownloaded(true);
      } finally {
        setIsTriggeringDownload(false);
      }
    },
    [media?.title, selectedFormat?.extension, selectedFormat?.isAudio]
  );

  // Status Polling Loop
  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      if (!downloadJobId) return;

      try {
        const data: DownloadStatusResponse = await getDownloadStatus(downloadJobId);

        if (!isMounted) return;

        const currentStatus = (data.status as "queued" | "processing" | "ready" | "failed") || "processing";
        setStatus(currentStatus);
        setProgressPercent(data.progress_percent || 0);

        if (currentStatus === "ready") {
          const resolvedFileUrl = data.file_url || `/api/v1/files/${downloadJobId}`;
          setFileUrl(resolvedFileUrl);

          updateHistoryItemStatus(downloadJobId, "Completed", resolvedFileUrl);

          if (onComplete) {
            onComplete(resolvedFileUrl);
          }

          if (!autoTriggeredRef.current) {
            autoTriggeredRef.current = true;
            triggerNativeDownload(resolvedFileUrl);
          }
          return;
        }

        if (currentStatus === "failed") {
          const errStr = data.error || "Processing failed on server.";
          setErrorMessage(errStr);
          updateHistoryItemStatus(downloadJobId, "Failed");
          return;
        }

        if (currentStatus === "queued" || currentStatus === "processing") {
          timerId = setTimeout(pollStatus, 1200);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error polling download status:", err);
        timerId = setTimeout(pollStatus, 2000);
      }
    };

    pollStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [downloadJobId, onComplete, triggerNativeDownload]);

  const qualityDisplay = selectedFormat?.quality || "Best Quality";
  const extensionDisplay = (selectedFormat?.extension || (selectedFormat?.isAudio ? "MP3" : "MP4")).toUpperCase();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100 min-h-[75vh] space-y-6">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackToSearch}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white bg-[#202119] hover:bg-[#2A2B20] border border-[#323428] rounded-xl transition-all cursor-pointer"
        >
          <span className="font-mono text-base">←</span>
          <span>Back to Search</span>
        </button>

        <span className="px-3 py-1 bg-[#202119] border border-[#323428] rounded-full text-xs font-mono text-zinc-400">
          Job ID: {downloadJobId.slice(0, 12)}...
        </span>
      </div>

      {/* Main Animated Bento Progress Card */}
      <div className="w-full bg-[#202119] border border-[#323428] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Media Summary Bar */}
        {media && (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
            <div className="relative w-20 h-20 sm:w-24 sm:h-18 rounded-lg overflow-hidden bg-black border border-[#323428] shrink-0">
              {media.thumbnailUrl && !imageError ? (
                <img
                  src={media.thumbnailUrl}
                  alt={media.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
                  No Image
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate">{media.title}</h2>
              <p className="text-xs text-zinc-400 truncate">{media.uploader || "Unknown Creator"}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-[#A3D48D]/20 text-[#A3D48D] border border-[#A3D48D]/30 font-bold uppercase text-[10px]">
                  {extensionDisplay}
                </span>
                <span className="text-zinc-300">{qualityDisplay}</span>
                {selectedFormat?.filesize && (
                  <span className="text-zinc-500">• {selectedFormat.filesize}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Header & Animated Counter */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Status Badges */}
          {status === "queued" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Queued on Worker Node
            </div>
          )}

          {status === "processing" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A3D48D]/10 border border-[#A3D48D]/30 text-[#A3D48D] text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A3D48D] animate-pulse" />
              Extracting Streams ({Math.round(progressPercent)}%)
            </div>
          )}

          {status === "ready" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A3D48D]/20 border border-[#A3D48D]/40 text-[#A3D48D] text-xs font-mono font-bold uppercase tracking-wider">
              <span>✓</span>
              <span>Processing Complete</span>
            </div>
          )}

          {status === "failed" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>✕</span>
              <span>Extraction Error</span>
            </div>
          )}

          {/* Big Technical Percentage Counter */}
          {(status === "queued" || status === "processing" || status === "ready") && (
            <div className="space-y-1">
              <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-[#A3D48D]">
                {Math.round(progressPercent)}%
              </div>
              <p className="text-xs text-zinc-400 max-w-md font-mono">
                {status === "ready" && "File is ready! Browser download triggered."}
                {status === "processing" && "Packaging audio/video streams with yt-dlp..."}
                {status === "queued" && "Waiting for available conversion worker..."}
              </p>
            </div>
          )}

          {status === "failed" && (
            <p className="text-xs text-red-300 font-mono max-w-md">
              {errorMessage || "Failed to download media file. Please check the URL or settings."}
            </p>
          )}
        </div>

        {/* Real-time Progress Bar */}
        {(status === "queued" || status === "processing" || status === "ready") && (
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="w-full bg-[#13140E] border border-[#323428] rounded-full h-4 overflow-hidden p-0.5 relative">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out bg-[#A3D48D] relative overflow-hidden"
                style={{ width: `${Math.max(4, Math.min(100, progressPercent))}%` }}
              >
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Action Triggers */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          {/* Main Save / Open File Trigger */}
          <button
            type="button"
            onClick={() => fileUrl && triggerNativeDownload(fileUrl)}
            disabled={status !== "ready" || isTriggeringDownload}
            className="flex-1 bg-[#A3D48D] hover:bg-[#92c57c] active:scale-[0.99] text-black font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-[#A3D48D]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTriggeringDownload ? (
              <>
                <svg className="w-5 h-5 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Triggering Download...</span>
              </>
            ) : status === "ready" ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{hasDownloaded ? "Save / Open File Again" : "Save / Open File"}</span>
              </>
            ) : (
              <span>Preparing Download...</span>
            )}
          </button>

          {/* Back to Search Button */}
          <button
            type="button"
            onClick={handleBackToSearch}
            className="px-6 py-3.5 bg-[#13140E] hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl border border-[#323428] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Back to Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadScreen;
