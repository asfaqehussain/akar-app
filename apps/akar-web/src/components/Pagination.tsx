'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // If there's 1 or less pages, do not render controls
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
      
      {/* Mobile view controls */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
      
      {/* Desktop view controls */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
        <div>
          <p className="text-xs text-slate-500 font-medium">
            Showing Page <span className="font-bold text-slate-300">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-300">{totalPages}</span>
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-xl shadow-sm gap-1.5" aria-label="Pagination">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            
            {/* Page number buttons */}
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center justify-center w-8 h-8 rounded-xl border text-xs font-bold transition-all ${
                  page === currentPage
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-400 font-extrabold'
                    : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 bg-slate-950'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </nav>
        </div>
      </div>
      
    </div>
  );
}
