'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const DISCLAIMER_STORAGE_KEY = '@disclaimer_accepted_at';

export interface DisclaimerModalProps {
  /** Force the modal to open regardless of localStorage state */
  forceOpen?: boolean;
  /** Optional callback fired after the user accepts the disclaimer */
  onAccept?: (timestamp: string) => void;
}

export function DisclaimerModal({ forceOpen = false, onAccept }: DisclaimerModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    const acceptedAt = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    if (!acceptedAt) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleAccept = () => {
    if (!isChecked) return;
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, timestamp);
    } catch (e) {
      console.warn('Unable to write disclaimer acceptance to localStorage:', e);
    }
    setIsOpen(false);
    if (onAccept) {
      onAccept(timestamp);
    }
  };

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-zinc-100">
        {/* Header Icon & Title */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h2 id="disclaimer-title" className="text-xl font-bold text-white">
              {t("disclaimerModalTitle")}
            </h2>
            <p className="mt-1 text-xs font-medium text-zinc-400">
              Please review and accept our usage guidelines to continue
            </p>
          </div>
        </div>

        {/* Scrollable Copy */}
        <div
          id="disclaimer-desc"
          className="max-h-56 overflow-y-auto rounded-xl bg-zinc-950 p-4 border border-zinc-800 text-xs leading-relaxed text-zinc-300 space-y-3"
        >
          <p>
            This application is provided for legitimate and authorized personal media management only.
            By proceeding, you explicitly affirm that you hold all requisite legal permissions, copyright ownership,
            or express authorization to access and download the requested material.
          </p>
          <p>
            You agree not to use this software to infringe upon any intellectual property rights, breach site terms of service,
            or download restricted or protected media without authorization.
          </p>
          <p>
            The developers assume no liability for misuse of this tool. Users are solely responsible for ensuring compliance with all local laws and third-party content rights.
          </p>
        </div>

        {/* Checkbox section */}
        <div className="mt-6 flex items-start space-x-3">
          <div className="flex h-5 items-center">
            <input
              id="disclaimer-checkbox"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
          <label
            htmlFor="disclaimer-checkbox"
            className="text-xs font-medium text-zinc-300 cursor-pointer select-none leading-tight"
          >
            I agree that I have permission to download this content.
          </label>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="button"
            disabled={!isChecked}
            onClick={handleAccept}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md ${
              isChecked
                ? 'bg-[#0B4DDE] text-white hover:bg-[#093ebd] active:scale-[0.98] cursor-pointer shadow-[#0B4DDE]/20'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {t("disclaimerAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisclaimerModal;
