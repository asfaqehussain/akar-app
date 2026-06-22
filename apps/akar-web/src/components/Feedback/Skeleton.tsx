'use client';

import React from 'react';

// Generic pulsing placeholder box
export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-xl ${className || 'h-4 w-full'}`} />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

// Table loading rows skeleton loader
export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
      <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/10">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-4 px-6">
                  <SkeletonPulse className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/80">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-4 px-6">
                    {colIndex === 0 ? (
                      <SkeletonPulse className="h-10 w-10 rounded-lg" />
                    ) : colIndex === 1 ? (
                      <SkeletonPulse className="h-3.5 w-24" />
                    ) : (
                      <SkeletonPulse className="h-3 w-16" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Details page layout card skeleton loader
export function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      {/* Left panel placeholder */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800/80 rounded-3xl p-4 min-h-[350px] flex items-center justify-center">
        <SkeletonPulse className="w-full h-80 rounded-2xl" />
      </div>
      
      {/* Right panel placeholder */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-6">
        <div className="space-y-2">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-5 w-40" />
          <SkeletonPulse className="h-3 w-28" />
        </div>
        <div className="w-full h-px bg-slate-800" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <SkeletonPulse className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <SkeletonPulse className="h-3 w-20" />
                <SkeletonPulse className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
