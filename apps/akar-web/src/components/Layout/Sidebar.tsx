'use client';

import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Map, Settings, ShieldAlert, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, active: true },
    { name: 'Verification Proofs', icon: FileSpreadsheet, active: false },
    { name: 'Live Map', icon: Map, active: false },
    { name: 'Security Alerts', icon: ShieldAlert, active: false },
    { name: 'System Settings', icon: Settings, active: false },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-45 flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 text-slate-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white uppercase">Akar Systems</h2>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Field Verification</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                  item.active 
                    ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  item.active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-200">
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
