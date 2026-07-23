"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ArrowDownToLine,
  History,
  Terminal,
  Settings,
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type NavDestinationId =
  | "download"
  | "home"
  | "history"
  | "commands"
  | "settings";

export interface NavItem {
  id: NavDestinationId;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  badge?: string | number;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "download",
    label: "Download",
    icon: <ArrowDownToLine className="w-4 h-4" />,
    shortcut: "⌘1",
  },
  {
    id: "history",
    label: "History",
    icon: <History className="w-4 h-4" />,
    shortcut: "⌘2",
  },
  {
    id: "commands",
    label: "Commands",
    icon: <Terminal className="w-4 h-4" />,
    shortcut: "⌘3",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    shortcut: "⌘4",
  },
];

export interface SealNavigationProps extends React.HTMLAttributes<HTMLElement> {
  activeTab?: NavDestinationId | string;
  onTabChange?: (tabId: NavDestinationId) => void;
  showBrand?: boolean;
  statusText?: string;
  isOnline?: boolean;
}

export const SealNavigation: React.FC<SealNavigationProps> = ({
  activeTab = "download",
  onTabChange,
  showBrand = true,
  statusText = "API Ready",
  isOnline = true,
  className,
  ...props
}) => {
  return (
    <nav
      aria-label="Seal Navigation Bar"
      className={cn(
        "w-full backdrop-blur-xl bg-[#13140E]/80 border-b border-[#36392D] px-4 sm:px-8 py-3 flex items-center justify-between transition-all select-none sticky top-0 z-50 shadow-xl shadow-black/20",
        className
      )}
      {...props}
    >
      {/* Brand & System Status */}
      <div className="flex items-center gap-4">
        {showBrand && (
          <div
            onClick={() => onTabChange?.("download")}
            className="flex items-center gap-3 cursor-pointer group transition-opacity hover:opacity-90 shrink-0"
          >
            <div className="relative w-9 h-9 rounded-xl bg-[#A3D48D] flex items-center justify-center text-[#13140E] font-black text-lg shadow-md shadow-[#A3D48D]/25 group-hover:scale-105 transition-all duration-200">
              <span className="text-base">🦭</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#13140E] flex items-center justify-center p-0.5">
                <span className="w-full h-full rounded-full bg-[#A3D48D]" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[#E3E3DC] tracking-tight group-hover:text-[#A3D48D] transition-colors">
                  Seal
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-[#202119] text-[#A3D48D] border border-[#36392D]">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-[#C6C8BC]/70 font-medium hidden sm:block">
                Media Extractor Engine
              </p>
            </div>
          </div>
        )}

        {/* Live Status Indicator Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#202119] border border-[#36392D] text-[11px] font-mono text-[#C6C8BC]">
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isOnline ? "bg-[#A3D48D]" : "bg-red-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isOnline ? "bg-[#A3D48D]" : "bg-red-500"
              )}
            />
          </span>
          <span className="font-semibold text-[#E3E3DC]">{statusText}</span>
        </div>
      </div>

      {/* Navigation Tabs with Active Pill & Keyboard Badges */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#202119]/80 border border-[#36392D]">
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
                "relative group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A3D48D]",
                isActive
                  ? "bg-[#A3D48D] text-[#13140E] font-bold shadow-md shadow-[#A3D48D]/20 border border-[#A3D48D]/40 scale-[1.02]"
                  : "text-[#C6C8BC] hover:text-[#E3E3DC] hover:bg-[#13140E]/60"
              )}
            >
              <span className="relative z-10 flex items-center justify-center">
                {item.icon}
              </span>

              <span className="relative z-10 tracking-wide font-sans">
                {item.label}
              </span>

              {/* Keyboard Shortcut Badge */}
              {item.shortcut && (
                <kbd
                  className={cn(
                    "relative z-10 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded font-bold transition-colors",
                    isActive
                      ? "bg-[#13140E]/20 text-[#13140E] border border-[#13140E]/30"
                      : "bg-[#13140E] text-[#C6C8BC]/70 border border-[#36392D] group-hover:border-[#A3D48D]/40 group-hover:text-[#A3D48D]"
                  )}
                >
                  {item.shortcut}
                </kbd>
              )}

              {item.badge !== undefined && (
                <span
                  className={cn(
                    "relative z-10 px-1.5 py-0.5 text-[10px] font-bold rounded-full font-mono",
                    isActive
                      ? "bg-[#13140E] text-[#A3D48D]"
                      : "bg-[#A3D48D] text-[#13140E]"
                  )}
                >
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
