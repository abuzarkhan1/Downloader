"use client";

import React, { useState, useEffect } from "react";
import { ResultsScreenProps, FormatOption } from "@/types";
import { getSettings } from "@/services/settingsStorage";

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  media,
  onDownload,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [imageError, setImageError] = useState(false);

  // Parity options initialized from persistent user settings
  const [sponsorblockRemove, setSponsorblockRemove] = useState<boolean>(false);
  const [embedSubtitles, setEmbedSubtitles] = useState<boolean>(false);
  const [audioCodec, setAudioCodec] = useState<"mp3" | "m4a" | "flac" | "opus">("mp3");
  const [audioBitrate, setAudioBitrate] = useState<"128k" | "192k" | "320k">("320k");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [remuxMkv, setRemuxMkv] = useState<boolean>(false);

  useEffect(() => {
    const s = getSettings();
    setSponsorblockRemove(s.sponsorblockRemove);
    setEmbedSubtitles(s.embedSubtitles);
    setAudioCodec(s.audioCodec);
    setAudioBitrate(s.audioBitrate);
    setRemuxMkv(s.remuxMkv);
  }, []);

  // Filter formats based on tab
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
    };

    if (onDownload) {
      onDownload(format, optionsPayload);
    } else if (format.url) {
      window.open(format.url, "_blank");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100 min-h-[70vh] space-y-6">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white bg-[#121215] hover:bg-zinc-800 border border-[#27272A] rounded-xl transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Download Another</span>
        </button>

        {media.platform && (
          <span className="px-3 py-1 bg-[#121215] border border-[#27272A] rounded-full text-xs font-semibold text-[#A3D48D] capitalize flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]"></span>
            {media.platform}
          </span>
        )}
      </div>

      {/* Main Results Container Card */}
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Media Preview Section */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start border-b border-[#27272A] bg-gradient-to-b from-[#A3D48D]/5 to-transparent">
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
                <svg className="w-3 h-3 text-[#A3D48D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="w-7 h-7 rounded-full bg-[#A3D48D]/20 border border-[#A3D48D]/40 flex items-center justify-center text-[#A3D48D] font-bold">
                {media.uploader ? media.uploader.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="font-medium text-zinc-300">
                {media.uploader || "Unknown Uploader"}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="px-2.5 py-1 rounded-md bg-[#09090B] border border-[#27272A] text-zinc-400">
                {media.formats.length} Formats Available
              </span>
            </div>
          </div>
        </div>

        {/* Seal MD3 Parity Options Bar (SponsorBlock, Subtitles, Codec, Clip Range) */}
        <div className="p-6 border-b border-[#27272A] bg-[#09090B]/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A3D48D] flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Download Parity Options</span>
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">yt-dlp Parity Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SponsorBlock & Subtitles Toggles */}
            <div className="space-y-2.5 bg-[#121215] border border-[#27272A] p-3.5 rounded-xl">
              <label className="text-xs font-semibold text-zinc-400">Content Modifiers</label>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300">SponsorBlock Skip</span>
                <button
                  type="button"
                  onClick={() => setSponsorblockRemove(!sponsorblockRemove)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    sponsorblockRemove ? "bg-[#A3D48D]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    sponsorblockRemove ? "translate-x-4 bg-black" : "translate-x-0 bg-white"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-300">Embed Subtitles</span>
                <button
                  type="button"
                  onClick={() => setEmbedSubtitles(!embedSubtitles)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    embedSubtitles ? "bg-[#A3D48D]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    embedSubtitles ? "translate-x-4 bg-black" : "translate-x-0 bg-white"
                  }`} />
                </button>
              </div>
            </div>

            {/* Audio Codec & Bitrate Pickers */}
            <div className="space-y-2.5 bg-[#121215] border border-[#27272A] p-3.5 rounded-xl">
              <label className="text-xs font-semibold text-zinc-400">Audio Codec & Bitrate</label>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-300">Codec</span>
                <div className="flex bg-[#09090B] border border-[#27272A] p-0.5 rounded-lg">
                  {(["mp3", "m4a", "flac", "opus"] as const).map((codec) => (
                    <button
                      key={codec}
                      type="button"
                      onClick={() => setAudioCodec(codec)}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                        audioCodec === codec
                          ? "bg-[#A3D48D] text-black font-extrabold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {codec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-zinc-300">Bitrate</span>
                <div className="flex bg-[#09090B] border border-[#27272A] p-0.5 rounded-lg">
                  {(["128k", "192k", "320k"] as const).map((bitrate) => (
                    <button
                      key={bitrate}
                      type="button"
                      onClick={() => setAudioBitrate(bitrate)}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                        audioBitrate === bitrate
                          ? "bg-[#A3D48D] text-black font-extrabold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {bitrate}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clip Range Inputs */}
            <div className="space-y-2.5 bg-[#121215] border border-[#27272A] p-3.5 rounded-xl">
              <label className="text-xs font-semibold text-zinc-400">Clip Range (Cut Segment)</label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="00:00"
                  className="w-1/2 bg-[#09090B] border border-[#27272A] text-xs text-center text-white font-mono rounded-lg py-1.5 focus:outline-none focus:border-[#A3D48D]"
                />
                <span className="text-xs text-zinc-500">to</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="02:30"
                  className="w-1/2 bg-[#09090B] border border-[#27272A] text-xs text-center text-white font-mono rounded-lg py-1.5 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-300">Remux MKV</span>
                <button
                  type="button"
                  onClick={() => setRemuxMkv(!remuxMkv)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    remuxMkv ? "bg-[#A3D48D]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    remuxMkv ? "translate-x-4 bg-black" : "translate-x-0 bg-white"
                  }`} />
                </button>
              </div>
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
                    ? "bg-[#A3D48D] text-black font-extrabold shadow-md shadow-[#A3D48D]/20"
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
                <span>Video Formats</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                  {videoFormats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "audio"
                    ? "bg-[#A3D48D] text-black font-extrabold shadow-md shadow-[#A3D48D]/20"
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
                <span>Audio Only ({audioCodec.toUpperCase()})</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
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
                    <div className="w-10 h-10 rounded-lg bg-[#121215] border border-[#27272A] flex items-center justify-center text-xs font-extrabold uppercase text-[#A3D48D] shrink-0 font-mono">
                      {activeTab === "audio" ? audioCodec.toUpperCase() : format.extension}
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
                        {activeTab === "audio" && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400 font-mono">{audioBitrate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download Button with Seal MD3 Lime Green */}
                  <button
                    type="button"
                    onClick={() => handleDownloadClick(format)}
                    className="shrink-0 bg-[#A3D48D] hover:bg-[#92c57c] active:scale-95 text-black text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-[#A3D48D]/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
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
