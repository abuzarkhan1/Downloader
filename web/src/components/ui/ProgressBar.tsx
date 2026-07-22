import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
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
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    return (
      <div ref={ref} className={cn("w-full flex flex-col gap-1.5", className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex justify-between items-center text-xs font-mono text-[#A1A1AA]">
            {label ? <span>{label}</span> : <span />}
            {showPercentage && !isIndeterminate && (
              <span>{Math.round(clampedProgress)}%</span>
            )}
          </div>
        )}
        <div
          className={cn(
            "w-full bg-[#09090B] border border-[#27272A] rounded-full overflow-hidden relative p-0.5",
            heightClasses[size]
          )}
        >
          {isIndeterminate ? (
            <div className="h-full bg-[#0B4DDE] rounded-full w-1/3 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          ) : (
            <div
              className="h-full bg-[#0B4DDE] rounded-full transition-all duration-300 ease-out shadow-sm shadow-[#0B4DDE]/50 relative"
              style={{ width: `${clampedProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
