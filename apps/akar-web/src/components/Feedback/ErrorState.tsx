'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ 
  title = 'An error occurred', 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="w-full bg-red-950/10 border border-red-900/30 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[300px] text-center animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-red-950/30 border border-red-900/55 flex items-center justify-center mb-4 shadow-lg shadow-red-950/20">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <h4 className="text-sm font-bold text-red-200">{title}</h4>
      <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-900/40 hover:bg-red-900/60 border border-red-800/80 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
