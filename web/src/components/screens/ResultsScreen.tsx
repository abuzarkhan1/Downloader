"use client";

import React, { useState, useEffect } from "react";
import { ResultsScreenProps, FormatOption } from "@/types";
import { getSettings, saveSettings } from "@/services/settingsStorage";

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  media,
  onDownload,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [imageError, setImageError] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Parity options state initialized from persistent user settings
  const [sponsorblockRemove, setSponsorblockRemove] = useState<boolean>(false);
  const [embedSubtitles, setEmbedSubtitles] = useState<boolean>(false);
  const [audioCodec, setAudioCodec] = useState<"mp3" | "m4a" | "flac" | "opus">("mp3");
  const [audioBitrate, setAudioBitrate] = useState<"128k" | "192k" | "320k">("320k");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [remuxMkv, setRemuxMkv] = useState<boolean>(false);
  const [proxyUrl, setProxyUrl] = useState<string>("");
  const [cookiesStr, setCookiesStr] = useState<string>("");

  useEffect(() => {
    const s = getSettings();
    setSponsorblockRemove(s.sponsorblockRemove);
    setEmbedSubtitles(s.embedSubtitles);
    setAudioCodec(s.audioCodec);
    setAudioBitrate(s.audioBitrate);
    setRemuxMkv(s.remuxMkv);
    setProxyUrl(s.proxyUrl || "");
    setCookiesStr(s.netscapeCookies || "");
  }, []);

  // Separate video vs audio format lists
  const videoFormats = media.formats.filter(
    (f) => f.isAudio !== true && !["mp3", "m4a", "aac", "wav", "flac", "opus"].includes(f.extension.toLowerCase())
  );

  const audioFormats = media.formats.filter(
    (f) => f.isAudio === true || ["mp3", "m4a", "aac", "wav", "flac", "opus"].includes(f.extension.toLowerCase())
  );

  const displayedFormats = activeTab === "video"
    ? (videoFormats.length > 0 ? videoFormats : media.formats)
    : (audioFormats.length > 0 ? audioFormats : media.formats);

  const handleDownloadClick = (format: FormatOption) => {
    const optionsPayload = {
      sponsorblock_remove: sponsorblockRemove,
      embed_subtitles: embedSubtitles,
      audio_codec: audioCodec,
      audio_bitrate: audioBitrate,
      start_time: startTime.trim() || undefined,
      end_time: endTime.trim() || undefined,
      remux_mkv: remuxMkv,
      proxy_url: proxyUrl.trim() || undefined,
      cookies_str: cookiesStr.trim() || undefined,
    };

    // Save updated options back to storage
    saveSettings({
      sponsorblockRemove,
      embedSubtitles,
      audioCodec,
      audioBitrate,
      remuxMkv,
      proxyUrl,
      netscapeCookies: cookiesStr,
    });

    if (onDownload) {
      onDownload(format, optionsPayload);
    } else if (format.url) {
      window.open(format.url, "_blank");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100 min-h-[75vh] space-y-6">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white bg-[#202119] hover:bg-[#2A2B20] border border-[#323428] rounded-xl transition-all cursor-pointer"
        >
          <span className="font-mono text-base">←</span>
          <span>Analyze Another Link</span>
        </button>

        {media.platform && (
          <span className="px-3 py-1 bg-[#202119] border border-[#323428] rounded-full text-xs font-mono font-semibold text-[#A3D48D] capitalize flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]" />
            {media.platform}
          </span>
        )}
      </div>

      {/* Bento Media Showcase Card */}
      <div className="w-full bg-[#202119] border border-[#323428] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left Thumbnail Container */}
          <div className="relative w-full md:w-72 h-48 sm:h-52 rounded-xl overflow-hidden bg-[#13140E] border border-[#323428] shrink-0 group">
            {media.thumbnailUrl && !imageError ? (
              <img
                src={media.thumbnailUrl}
                alt={media.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2 font-mono text-xs">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>No Preview Available</span>
              </div>
            )}

            {/* Duration Badge */}
            {media.duration && (
              <div className="absolute bottom-2.5 right-2.5 bg-black/90 backdrop-blur-md text-[#A3D48D] text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-[#A3D48D]/30 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{media.duration}</span>
              </div>
            )}
          </div>

          {/* Right Metadata & Details */}
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#A3D48D]/10 text-[#A3D48D] border border-[#A3D48D]/30 text-[10px] font-mono uppercase font-bold">
              Media Analysis Complete
            </div>

            <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-snug line-clamp-2">
              {media.title || "Untitled Media"}
            </h1>

            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <div className="w-7 h-7 rounded-full bg-[#A3D48D] flex items-center justify-center text-black font-extrabold text-xs">
                {media.uploader ? media.uploader.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="font-semibold text-zinc-200">{media.uploader || "Unknown Uploader"}</span>
            </div>

            {/* Metadata chips */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-[#13140E] border border-[#323428] text-zinc-300">
                ⚡ {media.formats.length} Quality Formats
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#13140E] border border-[#323428] text-[#A3D48D]">
                yt-dlp Parity Active
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Options Panel */}
        <div className="border-t border-[#323428] pt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full flex items-center justify-between p-3.5 bg-[#13140E] hover:bg-[#1A1C14] border border-[#323428] rounded-xl transition-all text-xs font-mono font-bold text-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-[#A3D48D]">⚙️</span>
              <span>Advanced CLI & Network Options (Remux, Proxy, Cookies, Clips)</span>
            </span>
            <span className="text-zinc-400">{showAdvancedOptions ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {showAdvancedOptions && (
            <div className="mt-3.5 p-4 bg-[#13140E] border border-[#323428] rounded-xl space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Remux MKV */}
                <div className="p-3 bg-[#202119] border border-[#323428] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Remux to MKV</span>
                    <button
                      type="button"
                      onClick={() => setRemuxMkv(!remuxMkv)}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        remuxMkv ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${
                        remuxMkv ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">Containerize formats into MKV stream without re-encoding.</p>
                </div>

                {/* Subtitles & SponsorBlock */}
                <div className="p-3 bg-[#202119] border border-[#323428] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">SponsorBlock Skip</span>
                    <button
                      type="button"
                      onClick={() => setSponsorblockRemove(!sponsorblockRemove)}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        sponsorblockRemove ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${
                        sponsorblockRemove ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-white">Embed Subtitles</span>
                    <button
                      type="button"
                      onClick={() => setEmbedSubtitles(!embedSubtitles)}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        embedSubtitles ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${
                        embedSubtitles ? "translate-x-3.5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Audio Codec & Bitrate */}
                <div className="p-3 bg-[#202119] border border-[#323428] rounded-xl space-y-2">
                  <span className="font-bold text-white block">Audio Options</span>
                  <div className="flex items-center justify-between gap-1">
                    {(["mp3", "m4a", "flac", "opus"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAudioCodec(c)}
                        className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded cursor-pointer ${
                          audioCodec === c ? "bg-[#A3D48D] text-black" : "text-zinc-400 hover:text-white bg-[#13140E]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Proxy & Cookies Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-mono text-[11px] text-zinc-400">Proxy URL (HTTP / SOCKS5)</label>
                  <input
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder="e.g. http://127.0.0.1:8080"
                    className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-white rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[11px] text-zinc-400">Clip Start & End (HH:MM:SS)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="00:00"
                      className="w-1/2 bg-[#202119] border border-[#323428] text-xs font-mono text-center text-white rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                    />
                    <span className="text-zinc-500 font-mono">-</span>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="02:30"
                      className="w-1/2 bg-[#202119] border border-[#323428] text-xs font-mono text-center text-white rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] text-zinc-400">Netscape Cookies.txt String</label>
                <textarea
                  rows={2}
                  value={cookiesStr}
                  onChange={(e) => setCookiesStr(e.target.value)}
                  placeholder="# Netscape HTTP Cookie File string for age-restricted / login videos..."
                  className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-zinc-300 rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Format Selection Header & Category Tabs */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex bg-[#13140E] border border-[#323428] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-[#A3D48D] text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🎬 Video Formats</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/20 font-mono">
                  {videoFormats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === "audio"
                    ? "bg-[#A3D48D] text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>🎧 Audio Only ({audioCodec.toUpperCase()})</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/20 font-mono">
                  {audioFormats.length}
                </span>
              </button>
            </div>
          </div>

          {/* Format Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedFormats.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-zinc-500 font-mono text-xs bg-[#13140E] border border-[#323428] rounded-xl">
                No matching formats found for this selection.
              </div>
            ) : (
              displayedFormats.map((format) => (
                <div
                  key={format.id || `${format.quality}-${format.extension}`}
                  className="bg-[#13140E] border border-[#323428] hover:border-[#A3D48D]/50 rounded-xl p-4 transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Quality & Metadata */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#202119] border border-[#323428] flex items-center justify-center font-mono font-extrabold text-xs text-[#A3D48D] shrink-0">
                      {activeTab === "audio" ? audioCodec.toUpperCase() : format.extension.toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white truncate">
                          {format.quality}
                        </span>
                        {format.fps && format.fps > 30 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {format.fps}fps
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                        <span>Est: {format.filesize || "Unknown"}</span>
                        {activeTab === "audio" && (
                          <>
                            <span>•</span>
                            <span className="text-[#A3D48D]">{audioBitrate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadClick(format)}
                    className="shrink-0 bg-[#A3D48D] hover:bg-[#92c57c] active:scale-95 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-[#A3D48D]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Download</span>
                    <span className="font-mono">↓</span>
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
