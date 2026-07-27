"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-[#09090B] border border-[#27272A] p-0.5 rounded-lg text-xs">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
          language === "en"
            ? "bg-[#0B4DDE] text-white shadow-sm font-semibold"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ur")}
        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
          language === "ur"
            ? "bg-[#0B4DDE] text-white shadow-sm font-semibold"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        اردو
      </button>
    </div>
  );
};

export default LanguageSelector;
