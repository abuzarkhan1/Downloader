"use client";

import React from "react";
import { LoadingScreenProps } from "@/types";

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  statusMessage = "Analyzing media link...",
  url,
  onCancel,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100 min-h-[60vh]">
      <div className="w-full bg-[#202119] border border-[#323428] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Lime Green Pulsing Aura & Spinner */}
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-[#A3D48D]/20 animate-ping opacity-75" />
          <div className="absolute inset-1 rounded-full border-2 border-[#A3D48D]/30" />

          <svg
            className="w-16 h-16 animate-spin text-[#A3D48D]"
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

          <div className="absolute w-3.5 h-3.5 rounded-full bg-[#A3D48D]" />
        </div>

        {/* Text Status */}
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-extrabold text-white tracking-tight">{statusMessage}</h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Extracting metadata, video qualities, and audio formats with yt-dlp.
          </p>

          {url && (
            <div className="mt-3 p-2 bg-[#13140E] border border-[#323428] rounded-lg text-xs text-[#A3D48D] font-mono truncate max-w-xs mx-auto">
              <span>{url}</span>
            </div>
          )}
        </div>

        {/* Optional Cancel Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono font-semibold text-zinc-400 hover:text-white bg-[#13140E] hover:bg-[#1A1C14] border border-[#323428] rounded-xl transition-colors cursor-pointer"
          >
            Cancel Analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
