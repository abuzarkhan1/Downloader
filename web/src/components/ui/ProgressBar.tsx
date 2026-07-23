import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number; // 0 to 100
  isIndeterminate?: boolean;
  showPercentage?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      progress = 0,
      isIndeterminate = false,
      showPercentage = false,
      label,
      size = "md",
      className,
      ...props
    },
    ref
  ) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    const heightClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4.5",
    };

    return (
      <div ref={ref} className={cn("w-full flex flex-col gap-1.5 select-none", className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex justify-between items-center text-xs font-mono text-[#C6C8BC]">
            {label ? <span className="font-semibold text-[#E3E3DC]">{label}</span> : <span />}
            {showPercentage && !isIndeterminate && (
              <span className="text-[#A3D48D] font-bold text-xs bg-[#202119] px-2 py-0.5 rounded-md border border-[#36392D]">
                {Math.round(clampedProgress)}%
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            "w-full bg-[#13140E] border border-[#36392D] rounded-full overflow-hidden relative p-0.5 shadow-inner",
            heightClasses[size]
          )}
        >
          {isIndeterminate ? (
            <div className="h-full bg-gradient-to-r from-[#A3D48D] via-[#B4EB12] to-[#A3D48D] rounded-full w-1/3 animate-pulse relative overflow-hidden shadow-sm shadow-[#A3D48D]/40">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          ) : (
            <div
              className="h-full bg-gradient-to-r from-[#A3D48D] to-[#B4EB12] rounded-full transition-all duration-300 ease-out shadow-sm shadow-[#A3D48D]/40 relative overflow-hidden"
              style={{ width: `${clampedProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
