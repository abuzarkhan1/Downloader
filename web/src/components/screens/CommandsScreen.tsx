"use client";

import React, { useState, useEffect } from "react";

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  flags: string;
  isPreset?: boolean;
}

const PRESET_COMMANDS: CommandTemplate[] = [
  {
    id: "preset_audio_mp3",
    name: "Audio Extractor (MP3 320kbps)",
    description: "Extract highest quality audio stream and convert to 320kbps MP3 with embedded cover artwork",
    flags: "-x --audio-format mp3 --audio-quality 0 --embed-thumbnail",
    isPreset: true,
  },
  {
    id: "preset_sponsorblock",
    name: "SponsorBlock Segment Stripper",
    description: "Automatically cut out sponsor clips, intro/outro bumpers, and self-promotion segments",
    flags: "--sponsorblock-remove all",
    isPreset: true,
  },
  {
    id: "preset_subs_thumb",
    name: "Subtitles & Metadata Inserter",
    description: "Embed all available subtitle languages and video thumbnail into container metadata",
    flags: "--embed-subs --sub-langs all --embed-thumbnail",
    isPreset: true,
  },
  {
    id: "preset_remux_mkv",
    name: "Lossless MKV Stream Container",
    description: "Combine best video and audio streams directly into MKV container without re-encoding",
    flags: '-f "bestvideo+bestaudio/best" --remux-video mkv',
    isPreset: true,
  },
  {
    id: "preset_proxy_cookies",
    name: "Proxy Bypass & Netscape Auth",
    description: "Bypass geo-restrictions and rate-limits using HTTP/SOCKS5 proxy and exported cookies",
    flags: '--proxy "http://127.0.0.1:8080" --cookies cookies.txt --force-ipv4',
    isPreset: true,
  },
];

const STORAGE_KEY = "videodownloader_custom_commands";

interface CommandsScreenProps {
  onExecuteCommand?: (flags: string) => void;
}

export const CommandsScreen: React.FC<CommandsScreenProps> = ({
  onExecuteCommand,
}) => {
  const [customCommands, setCustomCommands] = useState<CommandTemplate[]>([]);
  const [testUrl, setTestUrl] = useState<string>("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [selectedFlags, setSelectedFlags] = useState<string>(PRESET_COMMANDS[0].flags);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formFlags, setFormFlags] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          setCustomCommands(JSON.parse(raw));
        }
      } catch (err) {
        console.error("Failed to load custom command templates:", err);
      }
    }
  }, []);

  const saveCustomCommandsToStorage = (updated: CommandTemplate[]) => {
    setCustomCommands(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save custom command templates:", err);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormFlags("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cmd: CommandTemplate) => {
    if (cmd.isPreset) return;
    setEditingId(cmd.id);
    setFormName(cmd.name);
    setFormDesc(cmd.description);
    setFormFlags(cmd.flags);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formFlags.trim()) return;

    if (editingId) {
      const updated = customCommands.map((c) =>
        c.id === editingId
          ? { ...c, name: formName.trim(), description: formDesc.trim(), flags: formFlags.trim() }
          : c
      );
      saveCustomCommandsToStorage(updated);
    } else {
      const newCmd: CommandTemplate = {
        id: `custom_${Date.now()}`,
        name: formName.trim(),
        description: formDesc.trim(),
        flags: formFlags.trim(),
        isPreset: false,
      };
      saveCustomCommandsToStorage([...customCommands, newCmd]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCommand = (id: string) => {
    if (confirm("Are you sure you want to delete this custom command template?")) {
      const updated = customCommands.filter((c) => c.id !== id);
      saveCustomCommandsToStorage(updated);
    }
  };

  const handleCopyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allTemplates = [...PRESET_COMMANDS, ...customCommands];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100 min-h-[75vh]">
      {/* Screen Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#323428] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#202119] border border-[#323428] text-[#A3D48D] text-xs font-mono font-semibold tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]" />
            CLI Template Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Command Templates Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Build, test, and save custom yt-dlp CLI arguments, flags, and terminal templates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="self-start sm:self-center px-4 py-2.5 bg-[#A3D48D] hover:bg-[#92c57c] text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-[#A3D48D]/20 transition-all flex items-center gap-2 cursor-pointer font-mono"
        >
          <span>+ Add Custom Template</span>
        </button>
      </div>

      {/* Developer-Grade Terminal Studio Block */}
      <div className="w-full bg-[#202119] border border-[#323428] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono font-bold text-[#A3D48D] ml-2">
              yt-dlp Interactive Terminal Generator
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-500">yt-dlp v2026.03</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1 md:col-span-1">
            <label className="text-[11px] font-mono text-zinc-400">Target Video Link</label>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#13140E] border border-[#323428] text-xs text-white font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-[#A3D48D]"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-mono text-zinc-400">CLI Flags String</label>
            <input
              type="text"
              value={selectedFlags}
              onChange={(e) => setSelectedFlags(e.target.value)}
              placeholder="e.g. -x --audio-format mp3..."
              className="w-full bg-[#13140E] border border-[#323428] text-xs text-[#A3D48D] font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-[#A3D48D]"
            />
          </div>
        </div>

        {/* Terminal Code Preview */}
        <div className="relative bg-[#13140E] border border-[#323428] rounded-xl p-4 font-mono text-xs text-[#A3D48D] overflow-x-auto flex items-center justify-between gap-4">
          <code className="select-all truncate">
            <span className="text-zinc-500">$</span> yt-dlp {selectedFlags} "{testUrl}"
          </code>
          <button
            type="button"
            onClick={() => handleCopyCommand(`yt-dlp ${selectedFlags} "${testUrl}"`, "preview")}
            className="px-3 py-1.5 bg-[#202119] hover:bg-[#2A2B20] text-zinc-200 hover:text-white rounded-lg text-xs font-mono border border-[#323428] transition-colors shrink-0 cursor-pointer"
          >
            {copiedId === "preview" ? "Copied! ✓" : "Copy Command"}
          </button>
        </div>
      </div>

      {/* Bento Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allTemplates.map((cmd) => {
          const isSelected = selectedFlags === cmd.flags;

          return (
            <div
              key={cmd.id}
              onClick={() => setSelectedFlags(cmd.flags)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? "bg-[#202119] border-[#A3D48D] shadow-xl shadow-[#A3D48D]/10 ring-1 ring-[#A3D48D]/40"
                  : "bg-[#202119] border-[#323428] hover:border-[#A3D48D]/40"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{cmd.name}</span>
                    {cmd.isPreset ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        Built-in
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#A3D48D]/10 text-[#A3D48D] border border-[#A3D48D]/30">
                        Custom
                      </span>
                    )}
                  </h3>

                  {!cmd.isPreset && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(cmd);
                        }}
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-[#13140E]"
                        title="Edit template"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCommand(cmd.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-[#13140E]"
                        title="Delete template"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400">{cmd.description}</p>

                <div className="bg-[#13140E] border border-[#323428] rounded-xl p-3 font-mono text-[11px] text-[#A3D48D] truncate">
                  {cmd.flags}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#323428]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCommand(cmd.flags, cmd.id);
                  }}
                  className="px-3 py-1.5 bg-[#13140E] hover:bg-[#1A1C14] text-zinc-300 text-xs font-mono rounded-lg border border-[#323428] transition-colors cursor-pointer"
                >
                  {copiedId === cmd.id ? "Copied! ✓" : "Copy Flags"}
                </button>

                {onExecuteCommand && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecuteCommand(cmd.flags);
                    }}
                    className="px-3.5 py-1.5 bg-[#A3D48D] hover:bg-[#92c57c] text-black font-extrabold text-xs font-mono rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Use Flags</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add/Edit Custom Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#202119] border border-[#323428] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-mono">
              {editingId ? "Edit Custom Template" : "Add Custom Command Template"}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400">Template Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Extract FLAC Audio Lossless"
                  className="w-full bg-[#13140E] border border-[#323428] text-white rounded-xl p-3 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Notes on what this command does..."
                  className="w-full bg-[#13140E] border border-[#323428] text-white rounded-xl p-3 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">yt-dlp CLI Flags</label>
                <textarea
                  required
                  rows={3}
                  value={formFlags}
                  onChange={(e) => setFormFlags(e.target.value)}
                  placeholder="e.g. -x --audio-format flac --embed-thumbnail"
                  className="w-full bg-[#13140E] border border-[#323428] text-[#A3D48D] font-mono rounded-xl p-3 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white bg-[#13140E] rounded-xl border border-[#323428]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-extrabold text-black bg-[#A3D48D] hover:bg-[#92c57c] rounded-xl shadow-md"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandsScreen;
