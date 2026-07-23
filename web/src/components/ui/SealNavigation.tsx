"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowDownToLine, History, Terminal, Settings } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type NavDestinationId = "download" | "home" | "history" | "commands" | "settings";

export interface NavItem {
  id: NavDestinationId;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "download",
    label: "Download",
    icon: <ArrowDownToLine className="w-5 h-5" />,
  },
  {
    id: "history",
    label: "History",
    icon: <History className="w-5 h-5" />,
  },
  {
    id: "commands",
    label: "Commands",
    icon: <Terminal className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export interface SealNavigationProps extends React.HTMLAttributes<HTMLElement> {
  activeTab?: NavDestinationId | string;
  onTabChange?: (tabId: NavDestinationId) => void;
  showBrand?: boolean;
}

export const SealNavigation: React.FC<SealNavigationProps> = ({
  activeTab = "download",
  onTabChange,
  showBrand = true,
  className,
  ...props
}) => {
  return (
    <nav
      aria-label="Seal Material Design 3 Navigation"
      className={cn(
        "w-full bg-[#202119]/95 backdrop-blur-md border-b border-[#36392D] px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all select-none sticky top-0 z-50",
        className
      )}
      {...props}
    >
      {/* Brand Header */}
      {showBrand && (
        <div
          onClick={() => onTabChange?.("download")}
          className="flex items-center gap-3 cursor-pointer group transition-opacity hover:opacity-90 shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[#B4EB12] flex items-center justify-center text-[#13140E] font-black text-lg shadow-md shadow-[#B4EB12]/20 group-hover:scale-105 transition-transform">
            🦭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[#E3E3DC] tracking-tight">
                Seal
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-[#2F4D18] text-[#C6EE58] border border-[#38531D]">
                MD3
              </span>
            </div>
            <p className="text-[11px] text-[#C6C8BC] font-medium hidden sm:block">
              Video & Audio Extractor
            </p>
          </div>
        </div>
      )}

      {/* MD3 Navigation Destinations List */}
      <div className="flex items-center gap-1 sm:gap-2">
        {NAV_ITEMS.map((item) => {
          const isHomeOrDownload =
            (item.id === "download" || item.id === "home") &&
            (activeTab === "download" || activeTab === "home");
          const isActive = isHomeOrDownload || activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange?.(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative group flex flex-col sm:flex-row items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B4EB12]",
                isActive
                  ? "text-[#C6EE58]"
                  : "text-[#C6C8BC] hover:text-[#E3E3DC] hover:bg-[#25271F]"
              )}
            >
              {/* MD3 Active Indicator Pill Background */}
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-[#2F4D18] border border-[#38531D] shadow-sm shadow-[#B4EB12]/10 -z-0 animate-in fade-in zoom-in-95 duration-150" />
              )}

              <span className="relative z-10 flex items-center justify-center">
                {item.icon}
              </span>

              <span className="relative z-10 text-xs sm:text-sm font-semibold tracking-wide">
                {item.label}
              </span>

              {item.badge !== undefined && (
                <span className="relative z-10 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#B4EB12] text-[#13140E]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

SealNavigation.displayName = "SealNavigation";
