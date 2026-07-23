"use client";

import React, { useState, useEffect } from "react";
import {
  DownloadHistoryItem,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  searchHistory,
} from "@/services/historyStorage";

interface HistoryScreenProps {
  onReDownload?: (item: DownloadHistoryItem) => void;
  onNavigateHome?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onReDownload,
  onNavigateHome,
}) => {
  const [items, setItems] = useState<DownloadHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const refreshHistory = () => {
    const data = searchHistory(searchQuery, activeFilter);
    setItems(data);
  };

  useEffect(() => {
    refreshHistory();
  }, [searchQuery, activeFilter]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    refreshHistory();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all download history?")) {
      clearHistory();
      refreshHistory();
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown date";
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBadges: Record<string, { bg: string; text: string; border: string }> = {
    Completed: { bg: "bg-[#A3D48D]/10", text: "text-[#A3D48D]", border: "border-[#A3D48D]/30" },
    ready: { bg: "bg-[#A3D48D]/10", text: "text-[#A3D48D]", border: "border-[#A3D48D]/30" },
    Processing: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    processing: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    queued: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    Failed: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
    failed: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  };

  const filters = ["All", "Completed", "Processing", "Failed"];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-zinc-100 min-h-[75vh]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#323428] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#202119] border border-[#323428] text-[#A3D48D] text-xs font-mono font-semibold tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#A3D48D]" />
            Local Persistent Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Download History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#13140E] border border-[#323428] text-[#A3D48D] font-mono">
              {items.length} items
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Search, filter, re-download, or delete previously processed media files.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="self-start sm:self-center px-4 py-2 text-xs font-mono font-bold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Controls: Spotlight Search & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-3 text-zinc-500 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by title, creator, format..."
            className="w-full bg-[#202119] border border-[#323428] text-white text-xs sm:text-sm font-mono placeholder-zinc-500 rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:border-[#A3D48D] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#202119] border border-[#323428] p-1 rounded-xl shrink-0 overflow-x-auto">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#A3D48D] text-black shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-[#13140E]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bento Grid / Cards */}
      {items.length === 0 ? (
        <div className="w-full bg-[#202119] border border-[#323428] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#A3D48D]/10 border border-[#A3D48D]/30 flex items-center justify-center mx-auto text-[#A3D48D] font-mono text-xl">
            ⚡
          </div>
          <h3 className="text-lg font-extrabold text-white">No Download Records Found</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto font-mono">
            {searchQuery || activeFilter !== "All"
              ? "No items match your filter. Try adjusting your search query."
              : "History is currently empty. Start analyzing URLs to save records."}
          </p>
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="mt-2 px-5 py-2.5 bg-[#A3D48D] hover:bg-[#92c57c] text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Download Media Now</span>
              <span className="font-mono">→</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {items.map((item) => {
            const badge = statusBadges[item.status] || {
              bg: "bg-zinc-800",
              text: "text-zinc-300",
              border: "border-zinc-700",
            };

            return (
              <div
                key={item.id}
                className="bg-[#202119] border border-[#323428] hover:border-[#A3D48D]/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                {/* Media Details */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail / Extension Pill */}
                  <div className="w-16 h-16 sm:w-20 sm:h-14 rounded-xl overflow-hidden bg-[#13140E] border border-[#323428] shrink-0 relative flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-zinc-600 font-mono text-xs">No Img</span>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/90 rounded text-[9px] font-mono text-[#A3D48D] uppercase font-bold border border-[#A3D48D]/20">
                      {item.extension}
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-extrabold text-white truncate leading-snug group-hover:text-[#A3D48D] transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                      <span className="truncate max-w-[140px] text-zinc-300">{item.uploader}</span>
                      <span>•</span>
                      <span className="capitalize text-zinc-400">{item.platform}</span>
                      <span>•</span>
                      <span className="font-bold text-[#A3D48D]">{item.quality}</span>
                      <span>•</span>
                      <span className="text-[11px] text-zinc-500">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions & Status */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border uppercase ${badge.bg} ${badge.text} ${badge.border}`}>
                    {item.status}
                  </span>

                  {onReDownload && (
                    <button
                      type="button"
                      onClick={() => onReDownload(item)}
                      className="px-3.5 py-2 bg-[#A3D48D] hover:bg-[#92c57c] text-black font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      <span>Re-Download</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-[#13140E] rounded-xl transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
