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

  const categories: { id: TabCategory; label: string; icon: string }[] = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
    { id: "directory", label: "Directory & Naming", icon: "📁" },
    { id: "codec", label: "Format & Codec", icon: "🎧" },
    { id: "network", label: "Network & Cookies", icon: "🌐" },
    { id: "troubleshooting", label: "Troubleshooting", icon: "🛠️" },
    { id: "about", label: "About & Parity", icon: "ℹ️" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100 min-h-[75vh]">
      {/* Toast notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#A3D48D] text-black font-mono font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✓ Preferences Saved!</span>
        </div>
      )}

      {/* Screen Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#323428] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#202119] border border-[#323428] text-[#A3D48D] text-xs font-mono font-semibold tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]" />
            Drizzle-Style Config Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Settings & Preferences</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure video quality defaults, Netscape cookies manager, proxy endpoints, and audio codecs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          className="self-start sm:self-center px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white bg-[#202119] hover:bg-[#2A2B20] border border-[#323428] rounded-xl transition-all cursor-pointer"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Drizzle-Style Sidebar + Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar Category Tabs */}
        <div className="md:col-span-1 space-y-1 bg-[#202119] border border-[#323428] p-2 rounded-2xl h-fit">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#A3D48D] text-black shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-[#13140E]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Content Panel */}
        <div className="md:col-span-3 bg-[#202119] border border-[#323428] rounded-2xl p-6 shadow-2xl space-y-6">
          {/* GENERAL */}
          {activeCategory === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">General Preferences</h3>
                <p className="text-xs text-zinc-400">Configure default video resolutions and media behavior.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Default Video Quality</h4>
                    <p className="text-[11px] text-zinc-400">Preferred video resolution for auto-selection</p>
                  </div>
                  <select
                    value={settings.defaultQuality}
                    onChange={(e) => handleChange("defaultQuality", e.target.value)}
                    className="bg-[#202119] border border-[#323428] text-white text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-[#A3D48D]"
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
                <h3 className="text-base font-bold text-white mb-1">Appearance & Design System</h3>
                <p className="text-xs text-zinc-400">Customize visual appearance and OLED dark mode options.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
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

                <div className="p-4 bg-[#13140E] border border-[#323428] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Color Palette Audit</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#A3D48D] flex items-center justify-center font-bold text-black text-xs font-mono">
                      MD3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#A3D48D] font-mono">Lime Green Accent (`#A3D48D`)</p>
                      <p className="text-[11px] text-zinc-400">Surface: `#13140E` • Card: `#202119` • Border: `#323428`</p>
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
                <div className="space-y-2 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <label className="text-xs font-bold text-white font-mono">Output Template String</label>
                  <input
                    type="text"
                    value={settings.outputTemplate}
                    onChange={(e) => handleChange("outputTemplate", e.target.value)}
                    placeholder="%(title)s.%(ext)s"
                    className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-white rounded-lg p-2.5 focus:outline-none focus:border-[#A3D48D]"
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Standard yt-dlp syntax, e.g. <code className="text-[#A3D48D]">%(title)s [%(id)s].%(ext)s</code>
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
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
                <div className="p-4 bg-[#13140E] border border-[#323428] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Preferred Audio Codec</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["mp3", "m4a", "flac", "opus"] as const).map((codec) => (
                      <button
                        key={codec}
                        type="button"
                        onClick={() => handleChange("audioCodec", codec)}
                        className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          settings.audioCodec === codec
                            ? "bg-[#A3D48D] text-black shadow-md"
                            : "bg-[#202119] text-zinc-400 hover:text-white border border-[#323428]"
                        }`}
                      >
                        {codec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#13140E] border border-[#323428] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white">Target Audio Bitrate</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(["128k", "192k", "320k"] as const).map((bitrate) => (
                      <button
                        key={bitrate}
                        type="button"
                        onClick={() => handleChange("audioBitrate", bitrate)}
                        className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                          settings.audioBitrate === bitrate
                            ? "bg-[#A3D48D] text-black shadow-md"
                            : "bg-[#202119] text-zinc-400 hover:text-white border border-[#323428]"
                        }`}
                      >
                        {bitrate}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">SponsorBlock Auto-Removal</h4>
                      <p className="text-[11px] text-zinc-400">Automatically skip sponsors, intros, outros, and promos</p>
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

                  <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
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

                  <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
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
                {/* Netscape Cookies Manager */}
                <div className="space-y-2 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <label className="text-xs font-bold text-white font-mono">Netscape cookies.txt Manager</label>
                  <textarea
                    rows={4}
                    value={settings.netscapeCookies}
                    onChange={(e) => handleChange("netscapeCookies", e.target.value)}
                    placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / FALSE 0 SID..."
                    className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-[#A3D48D] rounded-lg p-2.5 focus:outline-none focus:border-[#A3D48D]"
                  />
                  <p className="text-[11px] text-zinc-500 font-mono">Paste exported cookies to bypass age gates and login requirements.</p>
                </div>

                {/* Proxy URL Input */}
                <div className="space-y-2 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <label className="text-xs font-bold text-white font-mono">HTTP / SOCKS5 Proxy URL</label>
                  <input
                    type="text"
                    value={settings.proxyUrl}
                    onChange={(e) => handleChange("proxyUrl", e.target.value)}
                    placeholder="e.g. http://user:pass@127.0.0.1:8080"
                    className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-white rounded-lg p-2.5 focus:outline-none focus:border-[#A3D48D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                    <label className="text-xs font-bold text-white font-mono">Max Filesize Limit</label>
                    <input
                      type="text"
                      value={settings.maxFilesize}
                      onChange={(e) => handleChange("maxFilesize", e.target.value)}
                      placeholder="e.g. 50M or 1G"
                      className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-white rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                    />
                  </div>

                  <div className="space-y-2 p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                    <label className="text-xs font-bold text-white font-mono">Download Rate Limit</label>
                    <input
                      type="text"
                      value={settings.rateLimit}
                      onChange={(e) => handleChange("rateLimit", e.target.value)}
                      placeholder="e.g. 500K or 5M"
                      className="w-full bg-[#202119] border border-[#323428] text-xs font-mono text-white rounded-lg p-2 focus:outline-none focus:border-[#A3D48D]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Force IPv4 Connection</h4>
                    <p className="text-[11px] text-zinc-400">Make requests strictly over IPv4 to bypass IPv6 timeouts</p>
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
                <p className="text-xs text-zinc-400">Test API server connectivity and toggle mock simulation mode.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white">Mock Mode (Offline Simulation)</h4>
                    <p className="text-[11px] text-zinc-400">Simulate media extraction without backend network connection</p>
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

                <div className="flex items-center justify-between p-4 bg-[#13140E] border border-[#323428] rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Backend API Server Status</h4>
                    <p className="text-[11px] font-mono text-zinc-400">
                      URL: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {apiStatus === "online" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#A3D48D]/10 text-[#A3D48D] border border-[#A3D48D]/30">
                        Online
                      </span>
                    )}
                    {apiStatus === "offline" && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                        Unreachable
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleTestApi}
                      disabled={apiStatus === "testing"}
                      className="px-3.5 py-1.5 bg-[#202119] hover:bg-[#2A2B20] text-white text-xs font-mono rounded-lg border border-[#323428] transition-colors cursor-pointer"
                    >
                      {apiStatus === "testing" ? "Testing..." : "Test Ping"}
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
                <h3 className="text-base font-bold text-white mb-1">About Seal MD3 VideoDownloader</h3>
                <p className="text-xs text-zinc-400">Next.js Web Client with Seal MD3 Bento Design System.</p>
              </div>

              <div className="p-5 bg-[#13140E] border border-[#323428] rounded-xl space-y-4 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#A3D48D] flex items-center justify-center font-black text-black text-lg">
                    V
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">VideoDownloader Web v2.5.0</h4>
                    <p className="text-zinc-400 text-[11px]">Universal Media Extractor Studio</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#323428] grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500">Theme:</span>
                    <p className="font-bold text-[#A3D48D]">Seal MD3 (`#A3D48D` Lime Green)</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Surface:</span>
                    <p className="font-bold text-zinc-300">Dark `#13140E` / Card `#202119`</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Engine:</span>
                    <p className="font-bold text-zinc-300">yt-dlp Python Backend</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Parity:</span>
                    <p className="font-bold text-[#A3D48D]">100% Mobile Parity</p>
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
