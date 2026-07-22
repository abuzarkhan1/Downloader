"use client";

import React from "react";
import { LoadingScreenProps } from "@/types";

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  statusMessage = "Analyzing media link...",
  url,
  onCancel,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090B] text-zinc-100 min-h-[60vh]">
      <div className="w-full bg-[#121215] border border-[#27272A] rounded-2xl p-8 shadow-2xl shadow-black/60 flex flex-col items-center text-center space-y-6">
        {/* Royal Blue Spinner Container */}
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* Outer glowing pulsing aura */}
          <div className="absolute inset-0 rounded-full bg-[#0B4DDE]/20 animate-ping opacity-75"></div>
          
          {/* Middle decorative ring */}
          <div className="absolute inset-1 rounded-full border-2 border-[#0B4DDE]/30"></div>

          {/* Main Royal Blue Spinner */}
          <svg
            className="w-16 h-16 animate-spin text-[#0B4DDE]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-100"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          {/* Center icon / dot */}
          <div className="absolute w-3 h-3 rounded-full bg-[#0B4DDE]"></div>
        </div>

        {/* Text Status */}
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold text-white tracking-tight">{statusMessage}</h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Fetching title, duration, uploader, and available video & audio formats.
          </p>

          {url && (
            <div className="mt-3 p-2 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-zinc-400 truncate max-w-xs mx-auto">
              <span className="font-mono text-zinc-500">{url}</span>
            </div>
          )}
        </div>

        {/* Optional Cancel Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-[#27272A] rounded-lg transition-colors cursor-pointer"
          >
            Cancel Analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
