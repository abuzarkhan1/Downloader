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
    description: "Extract highest quality audio and convert directly to MP3 with artwork",
    flags: "-x --audio-format mp3 --audio-quality 0 --embed-thumbnail",
    isPreset: true,
  },
  {
    id: "preset_sponsorblock",
    name: "SponsorBlock Clean Video",
    description: "Automatically skip sponsor segments, intros, outros, and self-promotions",
    flags: "--sponsorblock-remove all",
    isPreset: true,
  },
  {
    id: "preset_subs_thumb",
    name: "Embed Subtitles & Thumbnail",
    description: "Embed all available subtitles and cover artwork directly into file metadata",
    flags: "--embed-subs --sub-langs all --embed-thumbnail",
    isPreset: true,
  },
  {
    id: "preset_remux_mkv",
    name: "Best Quality MKV Container",
    description: "Download best video & audio streams and remux into MKV container without re-encoding",
    flags: '-f "bestvideo+bestaudio/best" --remux-video mkv',
    isPreset: true,
  },
  {
    id: "preset_proxy_cookies",
    name: "Proxy & Netscape Cookies",
    description: "Bypass geo-blocks or rate-limits using HTTP proxy and Netscape cookies",
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
  const [testUrl, setTestUrl] = useState<string>("https://www.youtube.com/watch?v=example");
  const [selectedFlags, setSelectedFlags] = useState<string>(PRESET_COMMANDS[0].flags);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form modal state for add/edit
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
        console.error("Failed to load custom commands", err);
      }
    }
  }, []);

  const saveCustomCommandsToStorage = (updated: CommandTemplate[]) => {
    setCustomCommands(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save custom commands", err);
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
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3D48D]/10 border border-[#A3D48D]/30 text-[#A3D48D] text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]"></span>
            yt-dlp CLI Manager
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Custom Command Templates</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage custom yt-dlp arguments, presets, and command line templates for advanced media extraction.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="self-start sm:self-center px-4 py-2.5 bg-[#A3D48D] hover:bg-[#92c57c] text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-[#A3D48D]/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Custom Template</span>
        </button>
      </div>

      {/* Live CLI Command Builder Box */}
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A3D48D] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Live Terminal Preview</span>
          </label>

          <span className="text-[11px] text-zinc-500 font-mono">yt-dlp v2026.03</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter test video URL..."
            className="w-full sm:w-1/3 bg-[#09090B] border border-[#27272A] text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#A3D48D]"
          />
          <input
            type="text"
            value={selectedFlags}
            onChange={(e) => setSelectedFlags(e.target.value)}
            placeholder="yt-dlp flags..."
            className="w-full sm:w-2/3 bg-[#09090B] border border-[#27272A] text-xs text-zinc-300 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#A3D48D]"
          />
        </div>

        {/* Terminal Output Code Display */}
        <div className="relative bg-[#09090B] border border-[#27272A] rounded-xl p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto flex items-center justify-between group">
          <code className="select-all">
            $ yt-dlp {selectedFlags} "{testUrl}"
          </code>
          <button
            type="button"
            onClick={() => handleCopyCommand(`yt-dlp ${selectedFlags} "${testUrl}"`, "preview")}
            className="ml-3 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] transition-colors shrink-0 cursor-pointer"
          >
            {copiedId === "preview" ? "Copied!" : "Copy Command"}
          </button>
        </div>
      </div>

      {/* Templates List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allTemplates.map((cmd) => {
          const isSelected = selectedFlags === cmd.flags;

          return (
            <div
              key={cmd.id}
              onClick={() => setSelectedFlags(cmd.flags)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? "bg-[#121215] border-[#A3D48D] shadow-lg shadow-[#A3D48D]/10 ring-1 ring-[#A3D48D]/50"
                  : "bg-[#121215] border-[#27272A] hover:border-zinc-700"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{cmd.name}</span>
                    {cmd.isPreset ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Built-in
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#A3D48D]/10 text-[#A3D48D] border border-[#A3D48D]/20">
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
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCommand(cmd.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-400">{cmd.description}</p>

                <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 truncate">
                  {cmd.flags}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCommand(cmd.flags, cmd.id);
                  }}
                  className="px-3 py-1.5 bg-[#09090B] hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-[#27272A] transition-colors cursor-pointer"
                >
                  {copiedId === cmd.id ? "Copied!" : "Copy Flags"}
                </button>

                {onExecuteCommand && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecuteCommand(cmd.flags);
                    }}
                    className="px-3.5 py-1.5 bg-[#A3D48D] hover:bg-[#92c57c] text-black font-extrabold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Use Flags</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit Custom Command */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272A] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingId ? "Edit Custom Command" : "Add Custom Command Template"}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Template Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Extract FLAC Lossless"
                  className="w-full bg-[#09090B] border border-[#27272A] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief note on what this command does..."
                  className="w-full bg-[#09090B] border border-[#27272A] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">yt-dlp CLI Flags</label>
                <textarea
                  required
                  rows={3}
                  value={formFlags}
                  onChange={(e) => setFormFlags(e.target.value)}
                  placeholder="e.g. -x --audio-format flac --embed-thumbnail"
                  className="w-full bg-[#09090B] border border-[#27272A] text-xs text-zinc-200 font-mono rounded-xl p-3 focus:outline-none focus:border-[#A3D48D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#09090B] rounded-xl border border-[#27272A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-black bg-[#A3D48D] hover:bg-[#92c57c] rounded-xl shadow-md"
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
