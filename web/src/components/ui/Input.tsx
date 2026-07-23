import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcutKey?: string;
  error?: boolean;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      leftIcon,
      rightIcon,
      shortcutKey = "⌘V",
      error,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative flex items-center w-full group", containerClassName)}>
        {leftIcon && (
          <div className="absolute left-4 flex items-center pointer-events-none text-[#C6C8BC] group-focus-within:text-[#A3D48D] transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full h-12 bg-[#13140E] border border-[#36392D] rounded-2xl px-4 font-mono text-sm text-[#E3E3DC] placeholder:text-[#C6C8BC]/50",
            "transition-all duration-200 focus:outline-none focus:border-[#A3D48D] focus:ring-2 focus:ring-[#A3D48D]/40 focus:shadow-[0_0_20px_rgba(163,212,141,0.15)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftIcon && "pl-11",
            (rightIcon || shortcutKey) && "pr-20",
            error &&
              "border-[#FF5252] focus:border-[#FF5252] focus:ring-[#FF5252]/40 focus:shadow-[0_0_20px_rgba(255,82,82,0.15)]",
            className
          )}
          {...props}
        />
        <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-auto">
          {rightIcon && <div className="flex items-center text-[#C6C8BC]">{rightIcon}</div>}
          {shortcutKey && !rightIcon && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold text-[#C6C8BC] bg-[#202119] border border-[#36392D] rounded-lg pointer-events-none shadow-sm">
              {shortcutKey}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
