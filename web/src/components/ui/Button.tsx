import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "container" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B4EB12]/50 focus:ring-offset-2 focus:ring-offset-[#13140E] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-[#B4EB12] hover:bg-[#a2d810] text-[#13140E] shadow-md shadow-[#B4EB12]/20 active:bg-[#92c40e]",
      container:
        "bg-[#2F4D18] hover:bg-[#38531D] text-[#C6EE58] border border-[#38531D] shadow-sm shadow-[#2F4D18]/40",
      secondary:
        "bg-[#25271F] hover:bg-[#2B2C23] text-[#E3E3DC] border border-[#36392D]",
      outline:
        "bg-transparent hover:bg-[#202119] text-[#E3E3DC] border border-[#36392D] hover:border-[#44483B]",
      ghost: "bg-transparent hover:bg-[#25271F] text-[#C6C8BC] hover:text-[#E3E3DC]",
      destructive:
        "bg-[#FF5252] hover:bg-[#e04545] text-white shadow-md shadow-[#FF5252]/20",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-13 px-7 text-base font-bold gap-2.5",
      icon: "h-11 w-11 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
