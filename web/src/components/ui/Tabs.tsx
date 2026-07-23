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
}

export interface TabsProps {
  activeTab: TabMode | string;
  onChange: (tabId: any) => void;
  options?: TabOption[];
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
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex p-1 bg-[#13140E] border border-[#36392D] rounded-2xl gap-1",
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
              "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B4EB12]",
              isActive
                ? "bg-[#B4EB12] text-[#13140E] shadow-md shadow-[#B4EB12]/20 font-bold"
                : "text-[#C6C8BC] hover:text-[#E3E3DC] hover:bg-[#25271F]"
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = "Tabs";
