"use client";

import React, { useState } from "react";
import { ResultsScreenProps, FormatOption, AudioFormatType, AudioBitrate, SubtitleOption } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  media,
  onDownload,
  onReset,
  removeWatermark = true,
  onToggleWatermark,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "subtitles">("video");
  const [imageError, setImageError] = useState(false);

  // Watermark toggle internal state fallback
  const [internalWatermark, setInternalWatermark] = useState<boolean>(true);
  const isWatermarkOn = removeWatermark !== undefined ? removeWatermark : internalWatermark;

  const handleWatermarkToggle = (val: boolean) => {
    setInternalWatermark(val);
    if (onToggleWatermark) {
      onToggleWatermark(val);
    }
  };

  // Custom Audio Selector State
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<AudioFormatType>("MP3");
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<AudioBitrate>("320 kbps");

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

  // Default subtitle options if none provided in media
  const subtitleList: SubtitleOption[] = media.subtitles || [
    { language: "English", code: "en", label: t("langEn"), formats: ["srt", "vtt", "txt"] },
    { language: "Urdu", code: "ur", label: t("langUr"), formats: ["srt", "vtt", "txt"] },
    { language: "Spanish", code: "es", label: t("langEs"), formats: ["srt", "vtt", "txt"] },
    { language: "French", code: "fr", label: t("langFr"), formats: ["srt", "vtt", "txt"] },
    { language: "German", code: "de", label: t("langDe"), formats: ["srt", "vtt", "txt"] },
    { language: "Arabic", code: "ar", label: t("langAr"), formats: ["srt", "vtt", "txt"] },
    { language: "Hindi", code: "hi", label: t("langHi"), formats: ["srt", "vtt", "txt"] },
    { language: "Japanese", code: "ja", label: t("langJa"), formats: ["srt", "vtt", "txt"] },
  ];

  const handleDownloadClick = (format: FormatOption) => {
    if (onDownload) {
      onDownload(format);
    } else if (format.url) {
      window.open(format.url, "_blank");
    }
  };

  const handleCustomAudioDownload = () => {
    const customFormat: FormatOption = {
      id: `${media.id}_custom_audio_${selectedAudioFormat}_${selectedAudioBitrate}`,
      quality: `${selectedAudioFormat} ${selectedAudioBitrate}`,
      extension: selectedAudioFormat.toLowerCase(),
      filesize: "~ 5.0 MB",
      isAudio: true,
      bitrate: selectedAudioBitrate,
    };
    if (onDownload) {
      onDownload(customFormat);
    }
  };

  const handleDownloadSubtitle = (subLang: string, subCode: string, ext: "srt" | "vtt" | "txt") => {
    const title = media.title || "subtitles";
    const safeTitle = title.replace(/[^a-z0-9_\-]/gi, "_").substring(0, 40);
    const filename = `${safeTitle}_${subCode}.${ext}`;

    let content = "";
    if (ext === "srt") {
      content = `1\n00:00:01,000 --> 00:00:05,000\n[${subLang} Subtitles - VideoDownloader]\n\n2\n00:00:05,500 --> 00:00:12,000\n${media.title}\n`;
    } else if (ext === "vtt") {
      content = `WEBVTT\n\n00:00.000 --> 00:05.000\n[${subLang} Subtitles - VideoDownloader]\n\n00:05.500 --> 00:12.000\n${media.title}\n`;
    } else {
      content = `[${subLang} Subtitles - VideoDownloader]\nTitle: ${media.title}\nUploader: ${media.uploader || "Unknown"}\nDuration: ${media.duration}\n`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[70vh]">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between mb-6 gap-4">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white bg-[#121215] hover:bg-zinc-800 border border-[#27272A] rounded-xl transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{t("downloadAnother")}</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Watermark Removal Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121215] border border-[#27272A] rounded-xl">
            <span className="text-xs font-medium text-zinc-300 hidden sm:inline">
              {t("removeWatermark")}
            </span>
            <button
              type="button"
              onClick={() => handleWatermarkToggle(!isWatermarkOn)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isWatermarkOn ? "bg-[#0B4DDE]" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isWatermarkOn ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {media.platform && (
            <span className="px-3 py-1 bg-[#121215] border border-[#27272A] rounded-full text-xs font-semibold text-zinc-400 capitalize hidden sm:inline">
              {media.platform}
            </span>
          )}
        </div>
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
                {t("availableFormats", { count: media.formats.length })}
              </span>
              {isWatermarkOn && (
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                  {t("watermarkRemovedBadge")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher (Video vs Audio vs Subtitles) */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-[#09090B] border border-[#27272A] p-1 rounded-xl gap-1">
              {/* Video Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
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
                <span>{t("videoTab")}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {videoFormats.length}
                </span>
              </button>

              {/* Audio Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("audio")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
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
                <span>{t("audioTab")}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {audioFormats.length}
                </span>
              </button>

              {/* Subtitles Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("subtitles")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "subtitles"
                    ? "bg-[#0B4DDE] text-white shadow-md shadow-[#0B4DDE]/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span>{t("subtitlesTab")}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {subtitleList.length}
                </span>
              </button>
            </div>
          </div>

          {/* AUDIO TAB: Custom Format & Bitrate Selector UI */}
          {activeTab === "audio" && (
            <div className="mb-6 p-5 bg-[#09090B] border border-[#27272A] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Audio Format & Bitrate Customizer</span>
                </h3>
              </div>

              {/* Format Options */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">{t("audioFormatLabel")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["MP3", "M4A", "WAV"] as AudioFormatType[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSelectedAudioFormat(fmt)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                        selectedAudioFormat === fmt
                          ? "bg-[#0B4DDE]/20 text-[#0B4DDE] border-[#0B4DDE]"
                          : "bg-[#121215] text-zinc-400 border-[#27272A] hover:text-white"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bitrate Options */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">{t("audioBitrateLabel")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["128 kbps", "192 kbps", "320 kbps"] as AudioBitrate[]).map((bitrate) => (
                    <button
                      key={bitrate}
                      type="button"
                      onClick={() => setSelectedAudioBitrate(bitrate)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                        selectedAudioBitrate === bitrate
                          ? "bg-[#0B4DDE]/20 text-[#0B4DDE] border-[#0B4DDE]"
                          : "bg-[#121215] text-zinc-400 border-[#27272A] hover:text-white"
                      }`}
                    >
                      {bitrate}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Action Button for Custom Audio */}
              <button
                type="button"
                onClick={handleCustomAudioDownload}
                className="w-full bg-[#0B4DDE] hover:bg-[#093ebd] active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[#0B4DDE]/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>
                  {t("downloadCustomAudio", { format: selectedAudioFormat, bitrate: selectedAudioBitrate })}
                </span>
              </button>
            </div>
          )}

          {/* SUBTITLES TAB */}
          {activeTab === "subtitles" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-1">
                <h3 className="text-sm font-bold text-white">{t("subtitlesTitle")}</h3>
                <p className="text-xs text-zinc-400">{t("subtitlesDesc")}</p>
              </div>

              <div className="space-y-3">
                {subtitleList.map((sub) => (
                  <div
                    key={sub.code}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl hover:border-zinc-700 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#121215] border border-[#27272A] flex items-center justify-center text-xs font-bold text-amber-400 uppercase">
                        {sub.code}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{sub.label}</div>
                        <div className="text-xs text-zinc-500">Formats: .srt, .vtt, .txt</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadSubtitle(sub.language, sub.code, "srt")}
                        className="px-3 py-1.5 bg-[#121215] hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white rounded-lg border border-[#27272A] transition-colors"
                      >
                        {t("downloadSrt")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSubtitle(sub.language, sub.code, "vtt")}
                        className="px-3 py-1.5 bg-[#121215] hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white rounded-lg border border-[#27272A] transition-colors"
                      >
                        {t("downloadVtt")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSubtitle(sub.language, sub.code, "txt")}
                        className="px-3 py-1.5 bg-[#121215] hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white rounded-lg border border-[#27272A] transition-colors"
                      >
                        {t("downloadTxt")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Formats List for Video / Audio */}
          {activeTab !== "subtitles" && (
            <div className="space-y-3">
              {displayedFormats.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  {t("noFormatsFound")}
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
                          <span>{t("estSize", { size: format.filesize || "Unknown" })}</span>
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
                      <span>{t("download")}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
