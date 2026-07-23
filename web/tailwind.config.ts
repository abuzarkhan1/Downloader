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
        background: "#13140E",
        "background-alt": "#1B1C18",
        card: "#202119",
        surface: "#202119",
        "surface-container": "#202119",
        "surface-container-high": "#25271F",
        "surface-container-highest": "#2B2C23",
        secondary: "#25271F",
        inset: "#1B1C18",
        border: "#36392D",
        "border-hover": "#44483B",
        input: "#36392D",
        primary: {
          DEFAULT: "#B4EB12",
          seed: "#A3D48D",
          container: "#2F4D18",
          "container-alt": "#38531D",
          "on-container": "#C6EE58",
        },
        "text-primary": "#E3E3DC",
        "text-muted": "#C6C8BC",
        destructive: "#FF5252",
        success: "#B4EB12",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
