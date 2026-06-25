'use client';

import React from 'react';
import { Menu, Bell, Shield, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      
      {/* Search/Logo and Mobile Menu Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div>
          <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Verification Dashboard
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold uppercase tracking-wider">
            Operational Overview
          </p>
        </div>
      </div>

      {/* Telemetry quick icons */}
      <div className="flex items-center gap-4.5">
        
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        
        {/* Shield system integrity status badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-full">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Integrity Guard On
          </span>
        </div>

        {/* Notifications indicator */}
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-sky-500 rounded-full" />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-700 dark:text-white">Alex Rodriguez</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Lead Manager</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center overflow-hidden">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-300" />
          </div>
        </div>
      </div>
    </header>
  );
}
