'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import CustomErrorModal from './CustomErrorModal';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback element or render function */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.resetError);
        }
        return this.props.fallback;
      }

      return (
        <>
          {/* Main child fallback inline view */}
          <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-6 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 mb-4">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
              {this.state.error.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              onClick={this.resetError}
              className="mt-6 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-rose-500/20"
            >
              Try Again
            </button>
          </div>

          {/* Modal overlay popup for critical visibility */}
          <CustomErrorModal
            isOpen={true}
            title="Application Error"
            message={this.state.error.message || 'An unexpected error occurred.'}
            details={this.state.error.stack}
            onClose={this.resetError}
            actionLabel="Try Again"
            onAction={this.resetError}
          />
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
