"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { HomeScreenProps } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export const HomeScreen: React.FC<HomeScreenProps> = ({
  analyzeUrl,
  onAnalyzeUrl,
  initialUrl = "",
  isLoading = false,
  errorMessage = null,
  removeWatermark = true,
  onToggleWatermark,
  onBatchAnalyze,
}) => {
  const { t } = useLanguage();
  const [url, setUrl] = useState<string>(initialUrl);
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [batchUrlsText, setBatchUrlsText] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Watermark toggle internal state fallback
  const [internalWatermark, setInternalWatermark] = useState<boolean>(true);
  const isWatermarkOn = removeWatermark !== undefined ? removeWatermark : internalWatermark;

  const handleWatermarkToggle = (val: boolean) => {
    setInternalWatermark(val);
    if (onToggleWatermark) {
      onToggleWatermark(val);
    }
  };

  // Clipboard Auto-Detect state
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [showClipboardBanner, setShowClipboardBanner] = useState<boolean>(false);

  useEffect(() => {
    const detectClipboard = async () => {
      try {
        if (typeof window !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          const trimmed = (text || "").trim();
          if (trimmed && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
            setClipboardUrl(trimmed);
            setShowClipboardBanner(true);
          }
        }
      } catch {
        // Permissions not granted or clipboard API not available
      }
    };
    detectClipboard();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (mode === "single") {
      const trimmed = url.trim();
      if (!trimmed) {
        setValidationError(t("validationEnterUrl"));
        return;
      }
      setValidationError(null);
      if (analyzeUrl) {
        analyzeUrl(trimmed);
      } else if (onAnalyzeUrl) {
        onAnalyzeUrl(trimmed);
      }
    } else {
      // Batch mode
      const rawLines = batchUrlsText.split("\n");
      const validUrls = rawLines
        .map((l) => l.trim())
        .filter((l) => l.startsWith("http://") || l.startsWith("https://"));

      if (validUrls.length === 0) {
        setValidationError(t("validationEnterUrls"));
        return;
      }
      setValidationError(null);
      if (onBatchAnalyze) {
        onBatchAnalyze(validUrls);
      } else if (analyzeUrl) {
        // Analyze first URL as fallback
        analyzeUrl(validUrls[0]);
      }
    }
  };

  const handleClear = () => {
    if (mode === "single") {
      setUrl("");
    } else {
      setBatchUrlsText("");
    }
    setValidationError(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (mode === "single") {
            setUrl(text);
          } else {
            setBatchUrlsText((prev) => (prev ? `${prev}\n${text}` : text));
          }
          setValidationError(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleBannerPasteAndAnalyze = () => {
    if (!clipboardUrl) return;
    setUrl(clipboardUrl);
    setShowClipboardBanner(false);
    setValidationError(null);
    if (analyzeUrl) {
      analyzeUrl(clipboardUrl);
    } else if (onAnalyzeUrl) {
      onAnalyzeUrl(clipboardUrl);
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
  const detectedCount = batchUrlsText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http://") || l.startsWith("https://")).length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[70vh]">
      {/* Clipboard Auto-Detect Link Prompt Banner */}
      {showClipboardBanner && clipboardUrl && (
        <div className="w-full mb-6 p-4 bg-[#121215] border border-[#0B4DDE]/40 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0B4DDE]/20 border border-[#0B4DDE]/40 flex items-center justify-center text-[#0B4DDE] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{t("clipboardBannerTitle")}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  URL
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-md">{clipboardUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleBannerPasteAndAnalyze}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[#0B4DDE] hover:bg-[#093ebd] text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              {t("pasteAndAnalyze")}
            </button>
            <button
              type="button"
              onClick={() => setShowClipboardBanner(false)}
              className="px-3 py-2 bg-[#09090B] hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium rounded-xl border border-[#27272A] transition-colors"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Header Title & Subtitle */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B4DDE]/10 border border-[#0B4DDE]/30 text-[#0B4DDE] text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#0B4DDE] animate-pulse"></span>
          {t("badgeTitle")}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          {t("heroTitlePart1")}{" "}
          <span className="bg-gradient-to-r from-blue-400 to-[#0B4DDE] bg-clip-text text-transparent">
            {t("heroTitlePart2")}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
          {t("heroDesc")}
        </p>
      </div>

      {/* Main URL Input Card */}
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/50 transition-all duration-300 hover:border-zinc-700">
        {/* Single Link vs Batch Mode Switcher */}
        <div className="flex items-center justify-between mb-4 border-b border-[#27272A] pb-4">
          <div className="flex bg-[#09090B] border border-[#27272A] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "single"
                  ? "bg-[#0B4DDE] text-white shadow-md shadow-[#0B4DDE]/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t("singleMode")}
            </button>
            <button
              type="button"
              onClick={() => setMode("batch")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "batch"
                  ? "bg-[#0B4DDE] text-white shadow-md shadow-[#0B4DDE]/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t("batchMode")}
            </button>
          </div>

          {mode === "batch" && (
            <span className="text-xs font-semibold text-[#0B4DDE] bg-[#0B4DDE]/10 px-2.5 py-1 rounded-lg border border-[#0B4DDE]/20">
              {t("linksFound", { count: detectedCount })}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label htmlFor="url-input" className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
              {mode === "single" ? t("enterSingleUrl") : t("enterBatchUrls")}
            </label>

            {/* Remove Watermark Toggle Switch */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleWatermarkToggle(!isWatermarkOn)}>
              <span className="text-xs font-medium text-zinc-300 hidden sm:inline">
                {t("removeWatermark")}
              </span>
              <button
                type="button"
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
          </div>

          {/* Watermark Status Pill */}
          {isWatermarkOn && (
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg w-fit">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{t("watermarkRemovedBadge")} (TikTok / Shorts)</span>
            </div>
          )}

          {mode === "single" ? (
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
                placeholder={t("placeholderSingle")}
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
                    onClick={handlePasteFromClipboard}
                    className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-md border border-[#27272A] transition-colors"
                    title="Paste from clipboard"
                  >
                    {t("pasteCopiedLink")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                id="batch-url-input"
                rows={5}
                value={batchUrlsText}
                onChange={(e) => {
                  setBatchUrlsText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={t("placeholderBatch")}
                className="w-full bg-[#09090B] border border-[#27272A] text-white placeholder-zinc-500 text-sm rounded-xl p-4 font-mono focus:outline-none focus:border-[#0B4DDE] focus:ring-2 focus:ring-[#0B4DDE]/20 transition-all"
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-md border border-[#27272A] transition-colors"
                >
                  {t("pasteCopiedLink")}
                </button>
                {batchUrlsText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-800/80 rounded-md border border-[#27272A]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

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
                <span>{mode === "single" ? t("analyzingLink") : t("analyzingBatch")}</span>
              </>
            ) : (
              <>
                <span>{mode === "single" ? t("analyzeLink") : t("analyzeBatch")}</span>
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
          {t("supportedPlatforms")}
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
