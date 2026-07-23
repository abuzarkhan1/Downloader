import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bento" | "glass" | "interactive";
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "bento", glow = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-[#36392D] bg-[#202119] text-[#E3E3DC] p-6 transition-all duration-300",
          variant === "bento" &&
            "shadow-2xl shadow-black/50 hover:border-[#A3D48D]/40 hover:shadow-[0_0_30px_rgba(163,212,141,0.08)] hover:-translate-y-0.5",
          variant === "glass" &&
            "backdrop-blur-md bg-[#202119]/80 shadow-xl border-[#36392D]/80",
          variant === "interactive" &&
            "cursor-pointer hover:border-[#A3D48D] hover:shadow-lg hover:shadow-[#A3D48D]/10 active:scale-[0.99]",
          glow &&
            "before:absolute before:-top-24 before:-left-24 before:w-48 before:h-48 before:bg-[#A3D48D]/5 before:rounded-full before:blur-3xl before:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-bold text-lg leading-tight tracking-tight text-[#E3E3DC] flex items-center gap-2",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#C6C8BC]/80 font-normal leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center pt-4 border-t border-[#36392D]/60 mt-4 text-xs text-[#C6C8BC]",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
