'use client';

import React from 'react';

export interface CustomErrorModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Modal title, defaults to 'An Error Occurred' */
  title?: string;
  /** Primary error message string */
  message: string;
  /** Optional technical error details or stack snippet */
  details?: string;
  /** Handler fired when closing or dismissing the modal */
  onClose: () => void;
  /** Optional secondary action label (e.g. 'Retry') */
  actionLabel?: string;
  /** Optional secondary action click handler */
  onAction?: () => void;
}

export function CustomErrorModal({
  isOpen,
  title = 'An Error Occurred',
  message,
  details,
  onClose,
  actionLabel,
  onAction,
}: CustomErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-message"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/30 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Error Header Icon */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 id="error-modal-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <p id="error-modal-message" className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 leading-normal">
              {message}
            </p>
          </div>
        </div>

        {/* Optional Error Details */}
        {details && (
          <div className="mt-3 max-h-36 overflow-y-auto rounded-lg bg-zinc-100 dark:bg-zinc-950 p-3 text-xs font-mono text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 break-words whitespace-pre-wrap">
            {details}
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-2">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-rose-500/20"
            >
              {actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomErrorModal;
