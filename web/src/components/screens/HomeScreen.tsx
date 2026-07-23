"use client";

import React, { useState, FormEvent } from "react";
import { HomeScreenProps } from "@/types";

export const HomeScreen: React.FC<HomeScreenProps> = ({
  analyzeUrl,
  onAnalyzeUrl,
  initialUrl = "",
  isLoading = false,
  errorMessage = null,
}) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError("Please enter a video or audio URL");
      return;
    }
    setValidationError(null);
    if (analyzeUrl) {
      analyzeUrl(trimmed);
    } else if (onAnalyzeUrl) {
      onAnalyzeUrl(trimmed);
    }
  };

  const handleClear = () => {
    setUrl("");
    setValidationError(null);
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          setValidationError(null);
        }
      }
    } catch (err) {
      // Clipboard permissions denied or unavailable
    }
  };

  const platforms = [
    {
      name: "YouTube",
      badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.56-1.28 2.57.02 1.2.74 2.31 1.83 2.8 1.09.52 2.43.38 3.37-.36.78-.6 1.25-1.57 1.25-2.57V.02z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  const activeError = validationError || errorMessage;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[70vh]">
      {/* Header Title & Subtitle */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B4DDE]/10 border border-[#0B4DDE]/30 text-[#0B4DDE] text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#0B4DDE] animate-pulse"></span>
          Universal Downloader
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Download Video & Audio <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 to-[#0B4DDE] bg-clip-text text-transparent">
            From Any Platform
          </span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
          Paste your video link below to analyze and extract high-quality video and audio files instantly.
        </p>
      </div>

      {/* Main URL Input Card */}
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/50 transition-all duration-300 hover:border-zinc-700">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="url-input" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
            Media Link URL
          </label>

          <div className="relative flex items-center">
            {/* Link Icon */}
            <div className="absolute left-4 text-zinc-500 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>

            {/* Input field */}
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Paste URL (e.g., https://www.youtube.com/watch?v=...)"
              className="w-full bg-[#09090B] border border-[#27272A] text-white placeholder-zinc-500 text-sm sm:text-base rounded-xl pl-12 pr-24 py-3.5 focus:outline-none focus:border-[#0B4DDE] focus:ring-2 focus:ring-[#0B4DDE]/20 transition-all"
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Action buttons inside input */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {url ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors"
                  title="Clear input"
                  aria-label="Clear input"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-md border border-[#27272A] transition-colors"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              )}
            </div>
          </div>

          {/* Validation or API error notice */}
          {activeError && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs sm:text-sm">
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{activeError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#0B4DDE] hover:bg-[#093ebd] active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-[#0B4DDE]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analyzing Link...</span>
              </>
            ) : (
              <>
                <span>Analyze Link</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Supported Platforms Tags */}
      <div className="w-full mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center mb-3">
          Supported Platforms
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${platform.badgeClass}`}
            >
              {platform.icon}
              <span>{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
