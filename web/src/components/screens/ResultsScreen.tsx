"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ResultsScreenProps, FormatOption } from "@/types";

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  media,
  onDownload,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [imageError, setImageError] = useState(false);

  // Filter formats based on tab
  const videoFormats = media.formats.filter(
    (f) => f.isAudio !== true && !["mp3", "m4a", "aac", "wav", "flac"].includes(f.extension.toLowerCase())
  );

  const audioFormats = media.formats.filter(
    (f) => f.isAudio === true || ["mp3", "m4a", "aac", "wav", "flac"].includes(f.extension.toLowerCase())
  );

  const displayedFormats = activeTab === "video" 
    ? (videoFormats.length > 0 ? videoFormats : media.formats) 
    : (audioFormats.length > 0 ? audioFormats : media.formats);

  const handleDownloadClick = (format: FormatOption) => {
    if (onDownload) {
      onDownload(format);
    } else if (format.url) {
      window.open(format.url, "_blank");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[70vh]">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white bg-[#121215] hover:bg-zinc-800 border border-[#27272A] rounded-xl transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Download Another</span>
        </button>

        {media.platform && (
          <span className="px-3 py-1 bg-[#121215] border border-[#27272A] rounded-full text-xs font-semibold text-zinc-400 capitalize">
            {media.platform}
          </span>
        )}
      </div>

      {/* Main Results Container Card */}
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Media Preview Section */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start border-b border-[#27272A] bg-gradient-to-b from-zinc-900/50 to-transparent">
          {/* Thumbnail Box */}
          <div className="relative w-full md:w-64 h-44 sm:h-48 rounded-xl overflow-hidden bg-zinc-950 border border-[#27272A] shrink-0 group">
            {media.thumbnailUrl && !imageError ? (
              <img
                src={media.thumbnailUrl}
                alt={media.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 gap-2">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs">No Thumbnail</span>
              </div>
            )}

            {/* Duration Badge */}
            {media.duration && (
              <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-white text-xs font-mono font-semibold px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{media.duration}</span>
              </div>
            )}
          </div>

          {/* Title & Uploader Meta */}
          <div className="flex-1 space-y-3">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
              {media.title || "Untitled Media"}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
              <div className="w-7 h-7 rounded-full bg-[#0B4DDE]/20 border border-[#0B4DDE]/40 flex items-center justify-center text-[#0B4DDE] font-semibold">
                {media.uploader ? media.uploader.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="font-medium text-zinc-300">
                {media.uploader || "Unknown Uploader"}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="px-2.5 py-1 rounded-md bg-[#09090B] border border-[#27272A]">
                {media.formats.length} Formats Available
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher (Video vs Audio) */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-[#09090B] border border-[#27272A] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-[#0B4DDE] text-white shadow-md shadow-[#0B4DDE]/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Video</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {videoFormats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "audio"
                    ? "bg-[#0B4DDE] text-white shadow-md shadow-[#0B4DDE]/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <span>Audio</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {audioFormats.length}
                </span>
              </button>
            </div>
          </div>

          {/* Quality Formats List */}
          <div className="space-y-3">
            {displayedFormats.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No formats found for this category.
              </div>
            ) : (
              displayedFormats.map((format) => (
                <div
                  key={format.id || `${format.quality}-${format.extension}`}
                  className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl hover:border-zinc-700 transition-all gap-4"
                >
                  {/* Quality & Meta Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#121215] border border-[#27272A] flex items-center justify-center text-xs font-bold uppercase text-blue-400 shrink-0">
                      {format.extension}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold text-white truncate">
                          {format.quality}
                        </span>
                        {format.fps && format.fps > 30 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {format.fps}fps
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <span>Est. Size: {format.filesize || "Unknown"}</span>
                        {format.bitrate && (
                          <>
                            <span>•</span>
                            <span>{format.bitrate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadClick(format)}
                    className="shrink-0 bg-[#0B4DDE] hover:bg-[#093ebd] active:scale-95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#0B4DDE]/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
