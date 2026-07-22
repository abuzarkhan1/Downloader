"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DownloadScreenProps } from "@/types";
import { getDownloadStatus, DownloadStatusResponse } from "@/services/api";

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
        // Attempt direct blob download for seamless file save prompt in Chrome/Safari
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
        console.warn("Direct blob fetch download encountered issue, using fallback link:", err);
        // Fallback: direct anchor download trigger
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

  // Polling logic for GET /api/v1/download/{download_job_id}/status
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

          if (onComplete) {
            onComplete(resolvedFileUrl);
          }

          // Trigger browser-native download automatically when ready (once)
          if (!autoTriggeredRef.current) {
            autoTriggeredRef.current = true;
            triggerNativeDownload(resolvedFileUrl);
          }
          return;
        }

        if (currentStatus === "failed") {
          setErrorMessage(data.error || "Processing failed on server. Please try again.");
          return;
        }

        // Continue polling if queued or processing
        if (currentStatus === "queued" || currentStatus === "processing") {
          timerId = setTimeout(pollStatus, 1200);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error polling download status:", err);
        // Retry polling on temporary network glitch
        timerId = setTimeout(pollStatus, 2000);
      }
    };

    pollStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [downloadJobId, onComplete, triggerNativeDownload]);

  // Format display helper
  const qualityDisplay = selectedFormat?.quality || "Best Quality";
  const extensionDisplay = (selectedFormat?.extension || (selectedFormat?.isAudio ? "MP3" : "MP4")).toUpperCase();

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[70vh]">
      {/* Navigation Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handleBackToSearch}
          className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white bg-[#121215] hover:bg-zinc-800 border border-[#27272A] rounded-xl transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Search</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-[#121215] border border-[#27272A] text-xs font-mono text-zinc-400">
            ID: {downloadJobId.slice(0, 14)}...
          </span>
        </div>
      </div>

      {/* Main Download Status Card */}
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
        {/* Media Summary Info */}
        {media && (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
            {/* Thumbnail */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-20 rounded-lg overflow-hidden bg-zinc-900 border border-[#27272A] shrink-0">
              {media.thumbnailUrl && !imageError ? (
                <img
                  src={media.thumbnailUrl}
                  alt={media.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Title & Format Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">{media.title}</h2>
              <p className="text-xs text-zinc-400 truncate">{media.uploader || "Unknown Creator"}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#0B4DDE]/20 text-[#0B4DDE] border border-[#0B4DDE]/30">
                  {extensionDisplay}
                </span>
                <span className="text-xs font-medium text-zinc-300">{qualityDisplay}</span>
                {selectedFormat?.filesize && (
                  <span className="text-xs text-zinc-500">• {selectedFormat.filesize}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Badge & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Status Badges */}
          {status === "queued" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              Queued in Server Queue
            </div>
          )}

          {status === "processing" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B4DDE] animate-pulse"></span>
              Processing Media ({Math.round(progressPercent)}%)
            </div>
          )}

          {status === "ready" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Ready for Download
            </div>
          )}

          {status === "failed" && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <svg className="w-4 h-4 fill-current text-red-400" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Download Failed
            </div>
          )}

          {/* Dynamic Headline */}
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {status === "ready" && "Your Download is Ready!"}
            {status === "processing" && "Extracting & Converting Media..."}
            {status === "queued" && "Preparing Download Job..."}
            {status === "failed" && "Failed to Process Download"}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            {status === "ready" && "Browser file download triggered automatically. You can also save or open the file below."}
            {status === "processing" && "Please wait while our backend converts and packages your high-quality file."}
            {status === "queued" && "Your request is queued. Processing will begin in a moment."}
            {status === "failed" && (errorMessage || "An error occurred while attempting to fetch or extract media.")}
          </p>
        </div>

        {/* Real-time Progress Bar */}
        {(status === "queued" || status === "processing" || status === "ready") && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-zinc-400">Conversion Progress</span>
              <span className="text-[#0B4DDE] font-mono">{Math.round(progressPercent)}%</span>
            </div>

            <div className="w-full bg-[#09090B] border border-[#27272A] rounded-full h-4 overflow-hidden p-0.5 relative">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-[#0B4DDE] to-blue-400 relative overflow-hidden"
                style={{ width: `${Math.max(5, Math.min(100, progressPercent))}%` }}
              >
                {/* Subtle animated shine effect */}
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {/* Main Open/Save / Re-Download Button */}
          <button
            type="button"
            onClick={() => fileUrl && triggerNativeDownload(fileUrl)}
            disabled={status !== "ready" || isTriggeringDownload}
            className="flex-1 bg-[#0B4DDE] hover:bg-[#093ebd] active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-[#0B4DDE]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isTriggeringDownload ? (
              <>
                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Saving File...</span>
              </>
            ) : status === "ready" ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>{hasDownloaded ? "Download File Again" : "Open / Save File"}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 animate-spin opacity-70" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Preparing Download...</span>
              </>
            )}
          </button>

          {/* Back to Search Button */}
          <button
            type="button"
            onClick={handleBackToSearch}
            className="px-6 py-3.5 bg-[#09090B] hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-xl border border-[#27272A] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Back to Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadScreen;
