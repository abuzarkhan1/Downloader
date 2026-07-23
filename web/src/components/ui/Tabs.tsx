import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Video, Music } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TabMode = "video" | "audio";

export interface TabOption {
  id: TabMode | string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  activeTab: TabMode | string;
  onChange: (tabId: any) => void;
  options?: TabOption[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

const defaultOptions: TabOption[] = [
  {
    id: "video",
    label: "Video",
    icon: <Video className="w-4 h-4" />,
  },
  {
    id: "audio",
    label: "Audio (MP3)",
    icon: <Music className="w-4 h-4" />,
  },
];

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onChange,
  options = defaultOptions,
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-5 py-2.5 text-base rounded-2xl gap-2.5",
  };

  return (
    <div
      className={cn(
        "inline-flex p-1 bg-[#13140E] border border-[#36392D] rounded-2xl gap-1 select-none",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = activeTab === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A3D48D] cursor-pointer",
              sizeClasses[size],
              isActive
                ? "bg-[#A3D48D] text-[#13140E] font-bold shadow-md shadow-[#A3D48D]/20 border border-[#A3D48D]/40 scale-[1.02]"
                : "text-[#C6C8BC] hover:text-[#E3E3DC] hover:bg-[#202119]"
            )}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full ml-1",
                  isActive
                    ? "bg-[#13140E] text-[#A3D48D]"
                    : "bg-[#A3D48D] text-[#13140E]"
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = "Tabs";
