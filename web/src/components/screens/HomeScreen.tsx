"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { HomeScreenProps } from "@/types";
import { getSettings, saveSettings } from "@/services/settingsStorage";

export const HomeScreen: React.FC<HomeScreenProps> = ({
  analyzeUrl,
  onAnalyzeUrl,
  initialUrl = "",
  isLoading = false,
  errorMessage = null,
}) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Parity quick options state synced with persistent settings
  const [sponsorblockRemove, setSponsorblockRemove] = useState<boolean>(false);
  const [embedSubtitles, setEmbedSubtitles] = useState<boolean>(false);
  const [audioCodec, setAudioCodec] = useState<"mp3" | "m4a" | "flac" | "opus">("mp3");
  const [audioBitrate, setAudioBitrate] = useState<"128k" | "192k" | "320k">("320k");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  useEffect(() => {
    const s = getSettings();
    setSponsorblockRemove(s.sponsorblockRemove);
    setEmbedSubtitles(s.embedSubtitles);
    setAudioCodec(s.audioCodec);
    setAudioBitrate(s.audioBitrate);
  }, []);

  const handleToggleSponsorblock = () => {
    const next = !sponsorblockRemove;
    setSponsorblockRemove(next);
    saveSettings({ sponsorblockRemove: next });
  };

  const handleToggleSubtitles = () => {
    const next = !embedSubtitles;
    setEmbedSubtitles(next);
    saveSettings({ embedSubtitles: next });
  };

  const handleSelectCodec = (codec: "mp3" | "m4a" | "flac" | "opus") => {
    setAudioCodec(codec);
    saveSettings({ audioCodec: codec });
  };

  const handleSelectBitrate = (bitrate: "128k" | "192k" | "320k") => {
    setAudioBitrate(bitrate);
    saveSettings({ audioBitrate: bitrate });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError("Please enter a valid video or audio URL");
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
    } catch {
      // Clipboard access unavailable or denied
    }
  };

  const activeError = validationError || errorMessage;

  const platforms = [
    { name: "YouTube", icon: "▶" },
    { name: "TikTok", icon: "🎵" },
    { name: "Instagram", icon: "📸" },
    { name: "Facebook", icon: "🌐" },
    { name: "X (Twitter)", icon: "🐦" },
    { name: "Vimeo", icon: "🎬" },
    { name: "SoundCloud", icon: "☁" },
    { name: "Reddit", icon: "💬" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100 min-h-[75vh] space-y-10 relative">
      {/* Radial Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(163,212,141,0.14)_0%,rgba(19,20,14,0)_70%)] pointer-events-none -z-10" />

      {/* Bento Hero Header Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#202119] border border-[#323428] text-[#A3D48D] text-xs font-mono font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#A3D48D] animate-pulse" />
          <span>yt-dlp v2026.03 Engine • Seal MD3</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Extract Any Media <br />
          <span className="text-[#A3D48D]">Lightning Fast.</span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-normal">
          High-performance 4K video converter & lossless audio extractor. Paste any link to instantly inspect formats and start downloading.
        </p>
      </div>

      {/* Spotlight Search Bar */}
      <div className="w-full max-w-3xl">
        <div className="bg-[#202119] border border-[#323428] rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/80 transition-all focus-within:border-[#A3D48D]/70 focus-within:ring-2 focus-within:ring-[#A3D48D]/20">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full flex items-center">
              {/* Search / Link Icon */}
              <div className="absolute left-3.5 text-zinc-500 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>

              {/* Input Field */}
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Paste video URL (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full bg-[#13140E] text-white placeholder:text-zinc-500 font-mono text-xs sm:text-sm rounded-xl pl-11 pr-24 py-3.5 focus:outline-none transition-all border border-[#2A2B20]"
                disabled={isLoading}
                autoComplete="off"
              />

              {/* Input Action Controls: Paste (⌘V) / Clear */}
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {url ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
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
                    className="px-2.5 py-1 text-[11px] font-mono font-semibold text-[#A3D48D] bg-[#202119] hover:bg-[#A3D48D] hover:text-black border border-[#A3D48D]/30 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Paste link from clipboard"
                  >
                    <span>Paste</span>
                    <kbd className="px-1 py-0.2 rounded bg-black/40 text-[9px] font-sans border border-[#A3D48D]/20">⌘V</kbd>
                  </button>
                )}
              </div>
            </div>

            {/* Analyze & Download Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto shrink-0 bg-[#A3D48D] hover:bg-[#92c57c] active:scale-[0.98] text-black font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-[#A3D48D]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze & Download</span>
                  <span className="font-mono text-base">→</span>
                </>
              )}
            </button>
          </form>

          {/* Validation or API error alert */}
          {activeError && (
            <div className="mt-2.5 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2 font-mono">
              <svg className="w-4 h-4 shrink-0 text-red-400 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{activeError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bento Quick Options Grid */}
      <div className="w-full max-w-4xl space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A3D48D]">
            ⚡ Bento Quick Extraction Options
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Auto-saved to preferences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: SponsorBlock Toggle */}
          <div className="bg-[#202119] border border-[#323428] hover:border-[#A3D48D]/40 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#A3D48D]">✂️</span> SponsorBlock
                </span>
                <button
                  type="button"
                  onClick={handleToggleSponsorblock}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    sponsorblockRemove ? "bg-[#A3D48D]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    sponsorblockRemove ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">Skip sponsor segments automatically</p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 bg-[#13140E] px-2 py-1 rounded border border-[#2D2E24]">
              {sponsorblockRemove ? "Status: ENABLED" : "Status: DISABLED"}
            </div>
          </div>

          {/* Card 2: Subtitles Toggle */}
          <div className="bg-[#202119] border border-[#323428] hover:border-[#A3D48D]/40 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#A3D48D]">💬</span> Subtitles
                </span>
                <button
                  type="button"
                  onClick={handleToggleSubtitles}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    embedSubtitles ? "bg-[#A3D48D]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    embedSubtitles ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">Embed captions into media file</p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 bg-[#13140E] px-2 py-1 rounded border border-[#2D2E24]">
              {embedSubtitles ? "Status: EMBEDDED" : "Status: OFF"}
            </div>
          </div>

          {/* Card 3: Audio Codec Chips */}
          <div className="bg-[#202119] border border-[#323428] hover:border-[#A3D48D]/40 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-2.5 group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-[#A3D48D]">🎧</span> Audio Format
              </span>
              <p className="text-[11px] text-zinc-400">Codec & target bitrate</p>
            </div>

            <div className="flex bg-[#13140E] border border-[#2D2E24] p-0.5 rounded-lg justify-between">
              {(["mp3", "m4a", "flac", "opus"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectCodec(c)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                    audioCodec === c
                      ? "bg-[#A3D48D] text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex bg-[#13140E] border border-[#2D2E24] p-0.5 rounded-lg justify-between">
              {(["128k", "192k", "320k"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleSelectBitrate(b)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                    audioBitrate === b
                      ? "bg-[#A3D48D] text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Card 4: Clip Range Inputs */}
          <div className="bg-[#202119] border border-[#323428] hover:border-[#A3D48D]/40 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-2.5 group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-[#A3D48D]">⏱️</span> Clip Range
              </span>
              <p className="text-[11px] text-zinc-400">Cut start / end segment</p>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00"
                className="w-1/2 bg-[#13140E] border border-[#2D2E24] text-[11px] text-center text-white font-mono rounded-lg py-1 focus:outline-none focus:border-[#A3D48D]"
              />
              <span className="text-[10px] text-zinc-500 font-mono">to</span>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="02:30"
                className="w-1/2 bg-[#13140E] border border-[#2D2E24] text-[11px] text-center text-white font-mono rounded-lg py-1 focus:outline-none focus:border-[#A3D48D]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Supported Platforms Pills */}
      <div className="w-full max-w-3xl space-y-3 pt-2 text-center">
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          Supported Platforms & Sites
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202119] border border-[#323428] text-xs text-zinc-300 font-medium hover:border-[#A3D48D]/40 transition-colors"
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
