"use client";

import React, { useState, useEffect } from "react";
import {
  UserSettings,
  getSettings,
  saveSettings,
  resetSettings,
} from "@/services/settingsStorage";
import apiClient from "@/services/api";

interface SettingsScreenProps {
  onSettingsChanged?: (newSettings: UserSettings) => void;
}

type TabCategory =
  | "general"
  | "appearance"
  | "directory"
  | "codec"
  | "network"
  | "troubleshooting"
  | "about";

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [activeCategory, setActiveCategory] = useState<TabCategory>("general");
  const [saveToast, setSaveToast] = useState(false);
  const [apiStatus, setApiStatus] = useState<"idle" | "testing" | "online" | "offline">("idle");
  const [mockMode, setMockMode] = useState<boolean>(apiClient.USE_MOCK);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
    if (onSettingsChanged) {
      onSettingsChanged(updated);
    }
    showToast();
  };

  const showToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleResetAll = () => {
    if (confirm("Reset all settings to default Seal MD3 values?")) {
      const reset = resetSettings();
      setSettings(reset);
      if (onSettingsChanged) onSettingsChanged(reset);
      showToast();
    }
  };

  const handleTestApi = async () => {
    setApiStatus("testing");
    try {
      // Test analyze endpoint with a lightweight mock or ping
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE_URL}/docs`, { method: "HEAD" });
      if (res.ok || res.status === 404) {
        setApiStatus("online");
      } else {
        setApiStatus("offline");
      }
    } catch {
      setApiStatus("offline");
    }
  };

  const categories: { id: TabCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: "general",
      label: "General",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: "directory",
      label: "Directory & Naming",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      id: "codec",
      label: "Format & Codec",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    },
    {
      id: "network",
      label: "Network & Cookies",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      id: "troubleshooting",
      label: "Troubleshooting",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "about",
      label: "About & Parity",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#A3D48D] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          <span>Preferences auto-saved!</span>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3D48D]/10 border border-[#A3D48D]/30 text-[#A3D48D] text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]"></span>
            Seal MD3 Preferences
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Settings & Preferences</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure default formats, audio codecs, SponsorBlock, network proxies, and Seal MD3 appearance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#121215] hover:bg-zinc-800 border border-[#27272A] rounded-xl transition-all cursor-pointer"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Main Settings Layout (Sidebar + Content) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-1 bg-[#121215] border border-[#27272A] p-2 rounded-2xl h-fit">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#A3D48D] text-black font-extrabold shadow-md shadow-[#A3D48D]/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-3 bg-[#121215] border border-[#27272A] rounded-2xl p-6 shadow-xl space-y-6">
          {/* GENERAL */}
          {activeCategory === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">General Preferences</h3>
                <p className="text-xs text-zinc-400">Configure default video resolutions and media behavior.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Default Video Quality</h4>
                    <p className="text-[11px] text-zinc-400">Preferred video resolution for auto-selection</p>
                  </div>
                  <select
                    value={settings.defaultQuality}
                    onChange={(e) => handleChange("defaultQuality", e.target.value)}
                    className="bg-[#121215] border border-[#27272A] text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3D48D]"
                  >
                    <option value="best">Best Available Quality</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeCategory === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Appearance & Theme</h3>
                <p className="text-xs text-zinc-400">Customize visual appearance and OLED dark mode options.</p>
              </div>

              <div className="space-y-4 pt-2">
                {/* OLED Dark Mode */}
                <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">OLED Dark Mode</h4>
                    <p className="text-[11px] text-zinc-400">Use pitch black backgrounds (`#000000`) for OLED displays</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("oledDarkMode", !settings.oledDarkMode)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.oledDarkMode ? "bg-[#A3D48D]" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        settings.oledDarkMode ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>

                {/* Theme Palette Banner */}
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Seal MD3 Theme Preview</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#A3D48D] flex items-center justify-center font-bold text-black text-xs shadow-md">
                      MD3
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#A3D48D]">Lime Green Accent (`#A3D48D`)</p>
                      <p className="text-[11px] text-zinc-400">Material Design 3 vibrant contrast system</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIRECTORY & NAMING */}
          {activeCategory === "directory" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Directory & File Naming</h3>
                <p className="text-xs text-zinc-400">Control yt-dlp output template patterns and filename restrictions.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <label className="text-xs font-bold text-white">Output Template String</label>
                  <input
                    type="text"
                    value={settings.outputTemplate}
                    onChange={(e) => handleChange("outputTemplate", e.target.value)}
                    placeholder="%(title)s.%(ext)s"
                    className="w-full bg-[#121215] border border-[#27272A] text-xs font-mono text-zinc-200 rounded-lg p-2.5 focus:outline-none focus:border-[#A3D48D]"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Standard yt-dlp syntax, e.g. <code className="text-zinc-400">%(title)s [%(id)s].%(ext)s</code>
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Restrict Filenames</h4>
                    <p className="text-[11px] text-zinc-400">Restrict filenames to ASCII characters and avoid spaces</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("restrictFilenames", !settings.restrictFilenames)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.restrictFilenames ? "bg-[#A3D48D]" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        settings.restrictFilenames ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT & CODEC */}
          {activeCategory === "codec" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Format & Audio Codecs</h3>
                <p className="text-xs text-zinc-400">Specify audio extraction formats, bitrates, remuxing, and SponsorBlock.</p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Audio Codec Picker */}
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Audio Codec</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["mp3", "m4a", "flac", "opus"] as const).map((codec) => (
                      <button
                        key={codec}
                        type="button"
                        onClick={() => handleChange("audioCodec", codec)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                          settings.audioCodec === codec
                            ? "bg-[#A3D48D] text-black shadow-md shadow-[#A3D48D]/20"
                            : "bg-[#121215] text-zinc-400 hover:text-white border border-[#27272A]"
                        }`}
                      >
                        {codec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Bitrate Picker */}
                <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Audio Bitrate</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(["128k", "192k", "320k"] as const).map((bitrate) => (
                      <button
                        key={bitrate}
                        type="button"
                        onClick={() => handleChange("audioBitrate", bitrate)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                          settings.audioBitrate === bitrate
                            ? "bg-[#A3D48D] text-black shadow-md shadow-[#A3D48D]/20"
                            : "bg-[#121215] text-zinc-400 hover:text-white border border-[#27272A]"
                        }`}
                      >
                        {bitrate}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">SponsorBlock Auto-Removal</h4>
                      <p className="text-[11px] text-zinc-400">Automatically remove sponsors, intros, outros, and promos</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("sponsorblockRemove", !settings.sponsorblockRemove)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.sponsorblockRemove ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black transition-transform ${
                          settings.sponsorblockRemove ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">Embed Subtitles</h4>
                      <p className="text-[11px] text-zinc-400">Embed available closed captions directly into output file</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("embedSubtitles", !settings.embedSubtitles)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.embedSubtitles ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black transition-transform ${
                          settings.embedSubtitles ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">Remux to MKV</h4>
                      <p className="text-[11px] text-zinc-400">Containerize downloaded video formats into MKV</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("remuxMkv", !settings.remuxMkv)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.remuxMkv ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black transition-transform ${
                          settings.remuxMkv ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">Crop Artwork Square</h4>
                      <p className="text-[11px] text-zinc-400">Crop embedded audio thumbnail artwork to 1:1 aspect ratio</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("cropArtwork", !settings.cropArtwork)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.cropArtwork ? "bg-[#A3D48D]" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black transition-transform ${
                          settings.cropArtwork ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NETWORK & COOKIES */}
          {activeCategory === "network" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Network, Proxies & Cookies</h3>
                <p className="text-xs text-zinc-400">Provide Netscape cookies.txt, custom proxies, and speed rate limits.</p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Netscape Cookies */}
                <div className="space-y-2 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <label className="text-xs font-bold text-white">Netscape cookies.txt String</label>
                  <textarea
                    rows={4}
                    value={settings.netscapeCookies}
                    onChange={(e) => handleChange("netscapeCookies", e.target.value)}
                    placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / FALSE 0 SID..."
                    className="w-full bg-[#121215] border border-[#27272A] text-xs font-mono text-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-[#A3D48D]"
                  />
                  <p className="text-[11px] text-zinc-500">Pass exported Netscape cookies to bypass login or age restrictions.</p>
                </div>

                {/* Proxy URL */}
                <div className="space-y-2 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <label className="text-xs font-bold text-white">HTTP / SOCKS5 Proxy URL</label>
                  <input
                    type="text"
                    value={settings.proxyUrl}
                    onChange={(e) => handleChange("proxyUrl", e.target.value)}
                    placeholder="e.g. http://user:pass@127.0.0.1:8080"
                    className="w-full bg-[#121215] border border-[#27272A] text-xs font-mono text-zinc-200 rounded-lg p-2.5 focus:outline-none focus:border-[#A3D48D]"
                  />
                </div>

                {/* Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                    <label className="text-xs font-bold text-white">Max Filesize Limit</label>
                    <input
                      type="text"
                      value={settings.maxFilesize}
                      onChange={(e) => handleChange("maxFilesize", e.target.value)}
                      placeholder="e.g. 50M or 1G"
                      className="w-full bg-[#121215] border border-[#27272A] text-xs text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                    />
                  </div>

                  <div className="space-y-2 p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                    <label className="text-xs font-bold text-white">Download Rate Limit</label>
                    <input
                      type="text"
                      value={settings.rateLimit}
                      onChange={(e) => handleChange("rateLimit", e.target.value)}
                      placeholder="e.g. 500K or 5M"
                      className="w-full bg-[#121215] border border-[#27272A] text-xs text-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                    />
                  </div>
                </div>

                {/* Force IPv4 */}
                <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Force IPv4 Connection</h4>
                    <p className="text-[11px] text-zinc-400">Make requests strictly over IPv4 (resolves IPv6 timeout issues)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("forceIpv4", !settings.forceIpv4)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.forceIpv4 ? "bg-[#A3D48D]" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        settings.forceIpv4 ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TROUBLESHOOTING */}
          {activeCategory === "troubleshooting" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Troubleshooting & Diagnostics</h3>
                <p className="text-xs text-zinc-400">Test backend connectivity, toggle mock mode, and purge cached data.</p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Mock Mode Switch */}
                <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Mock Mode (Offline Simulation)</h4>
                    <p className="text-[11px] text-zinc-400">Simulate media extraction without connecting to backend server</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !mockMode;
                      setMockMode(next);
                      apiClient.setUseMock(next);
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      mockMode ? "bg-[#A3D48D]" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        mockMode ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>

                {/* Test API Endpoint */}
                <div className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Backend API Server Connectivity</h4>
                    <p className="text-[11px] text-zinc-400">
                      Endpoint: <code className="text-zinc-300">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {apiStatus === "online" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#A3D48D]/10 text-[#A3D48D] border border-[#A3D48D]/30">
                        Online
                      </span>
                    )}
                    {apiStatus === "offline" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                        Unreachable
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleTestApi}
                      disabled={apiStatus === "testing"}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-[#27272A] transition-colors cursor-pointer"
                    >
                      {apiStatus === "testing" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeCategory === "about" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">About Universal VideoDownloader</h3>
                <p className="text-xs text-zinc-400">Next.js Web Client with Seal MD3 Design System.</p>
              </div>

              <div className="p-5 bg-[#09090B] border border-[#27272A] rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#A3D48D] flex items-center justify-center font-black text-black text-lg">
                    V
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">VideoDownloader Web v2.5.0</h4>
                    <p className="text-xs text-zinc-400">High-Parity yt-dlp Video & Audio Extractor</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#27272A] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500">UI Framework:</span>
                    <p className="font-semibold text-zinc-200">Next.js 15 App Router</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Design System:</span>
                    <p className="font-semibold text-[#A3D48D]">Seal MD3 (`#A3D48D` Lime Green)</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Storage Engine:</span>
                    <p className="font-semibold text-zinc-200">Browser LocalStorage</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">yt-dlp Parity:</span>
                    <p className="font-semibold text-emerald-400">100% Feature Complete</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
