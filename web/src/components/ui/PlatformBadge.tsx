import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PlatformType = "youtube" | "tiktok" | "instagram" | "facebook" | "twitter" | "x" | "auto" | string;

export interface PlatformBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  platform: PlatformType;
  isActive?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const platformMeta: Record<
  string,
  { name: string; dotColor: string; bgGlow: string; borderColor: string; icon?: string }
> = {
  youtube: {
    name: "YouTube",
    dotColor: "bg-[#FF0000]",
    bgGlow: "shadow-red-500/20",
    borderColor: "hover:border-red-500/40",
  },
  tiktok: {
    name: "TikTok",
    dotColor: "bg-[#00F2FE]",
    bgGlow: "shadow-cyan-400/20",
    borderColor: "hover:border-cyan-400/40",
  },
  instagram: {
    name: "Instagram",
    dotColor: "bg-[#E1306C]",
    bgGlow: "shadow-pink-500/20",
    borderColor: "hover:border-pink-500/40",
  },
  facebook: {
    name: "Facebook",
    dotColor: "bg-[#1877F2]",
    bgGlow: "shadow-blue-500/20",
    borderColor: "hover:border-blue-500/40",
  },
  twitter: {
    name: "X (Twitter)",
    dotColor: "bg-[#1DA1F2]",
    bgGlow: "shadow-sky-500/20",
    borderColor: "hover:border-sky-500/40",
    icon: "𝕏",
  },
  x: {
    name: "X (Twitter)",
    dotColor: "bg-[#1DA1F2]",
    bgGlow: "shadow-sky-500/20",
    borderColor: "hover:border-sky-500/40",
    icon: "𝕏",
  },
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  isActive = false,
  showLabel = true,
  size = "md",
  className,
  ...props
}) => {
  const normalizedKey = platform.toLowerCase();
  const meta = platformMeta[normalizedKey] || {
    name: platform,
    dotColor: "bg-[#B4EB12]",
    bgGlow: "shadow-[#B4EB12]/20",
    borderColor: "hover:border-[#B4EB12]/40",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
    md: "px-3.5 py-1.5 text-sm gap-2 rounded-xl",
    lg: "px-4 py-2 text-base gap-2.5 rounded-2xl",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold border transition-all duration-200 select-none",
        "bg-[#25271F] border-[#36392D] text-[#E3E3DC]",
        meta.borderColor,
        isActive && `border-[#B4EB12] bg-[#2F4D18] text-[#C6EE58] shadow-sm ${meta.bgGlow}`,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {meta.icon ? (
        <span className="shrink-0 text-xs font-bold leading-none">{meta.icon}</span>
      ) : (
        <span
          className={cn(
            "rounded-full shrink-0 shadow-sm",
            meta.dotColor,
            dotSizes[size]
          )}
        />
      )}
      {showLabel && <span>{meta.name}</span>}
    </div>
  );
};

PlatformBadge.displayName = "PlatformBadge";
