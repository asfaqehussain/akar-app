'use client';

import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export default function EmptyState({ 
  title, 
  description, 
  icon: Icon = FolderOpen, 
  action 
}: EmptyStateProps) {
  return (
    <div className="w-full bg-slate-900/30 border border-slate-800/80 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-900/80 flex items-center justify-center mb-4 border border-slate-800 shadow-inner">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-300">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
