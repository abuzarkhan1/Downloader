import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "container"
    | "outline"
    | "ghost"
    | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A3D48D]/50 focus:ring-offset-2 focus:ring-offset-[#13140E] disabled:opacity-50 disabled:cursor-not-allowed select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] cursor-pointer";

    const variants = {
      primary:
        "bg-[#A3D48D] hover:bg-[#b2e09d] text-[#13140E] font-bold shadow-md shadow-[#A3D48D]/20 border border-[#A3D48D]/50 hover:shadow-lg hover:shadow-[#A3D48D]/30",
      container:
        "bg-[#2F4D18] hover:bg-[#38531D] text-[#C6EE58] border border-[#38531D] shadow-sm shadow-[#2F4D18]/40",
      secondary:
        "bg-[#202119] hover:bg-[#282a20] text-[#E3E3DC] border border-[#36392D] hover:border-[#44483B] hover:shadow-md",
      outline:
        "bg-transparent hover:bg-[#202119] text-[#E3E3DC] border border-[#36392D] hover:border-[#A3D48D]/50",
      ghost:
        "bg-transparent hover:bg-[#202119] text-[#C6C8BC] hover:text-[#E3E3DC]",
      destructive:
        "bg-[#FF5252] hover:bg-[#e04545] text-white shadow-md shadow-[#FF5252]/20 border border-[#FF5252]/40",
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs gap-1.5 rounded-xl",
      md: "h-11 px-5 text-sm gap-2 rounded-2xl",
      lg: "h-13 px-7 text-base font-bold gap-2.5 rounded-2xl",
      icon: "h-11 w-11 p-0 rounded-2xl shrink-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
