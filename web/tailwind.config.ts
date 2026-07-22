import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        card: "#121215",
        surface: "#121215",
        secondary: "#19191E",
        inset: "#19191E",
        border: "#27272A",
        input: "#27272A",
        primary: {
          DEFAULT: "#0B4DDE",
          oklch: "oklch(0.66 0.16 252)",
        },
        "text-primary": "#FAFAFA",
        "text-muted": "#A1A1AA",
        destructive: "#FF5252",
        success: "#22C55E",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
