'use client';

import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import ProofTable from '../../components/proofs/ProofTable';
import { useProofs } from '../../hooks/useProofs';

export default function DashboardPage() {
  const { data: proofs } = useProofs();

  const totalProofs = proofs?.length ?? 0;
  const mockCount = proofs?.filter(p => p.mockLocation).length ?? 0;
  const rootedCount = proofs?.filter(p => p.isRooted).length ?? 0;
  const duplicateCount = proofs?.filter(p => p.duplicateProof).length ?? 0;
  const verifiedClean = proofs?.filter(p => !p.mockLocation && !p.isRooted && !p.duplicateProof && p.accuracyTier === 'good').length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Welcome Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">System Status Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review geolocational integrity telemetry and proof logs</p>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 px-3 py-1.5 rounded-lg">
            System Live: 100% Uptime
          </div>
        </div>

        {/* Metrics counters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Total Proofs</span>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalProofs}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-2">Captured proofs registered</span>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Verified Clean</span>
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{verifiedClean}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-2">100% integrity match</span>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Mock Geolocation</span>
            <span className="text-3xl font-extrabold text-red-600 dark:text-red-500">{mockCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-2">Suspicious locations flagged</span>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Compromised OS</span>
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-500">{rootedCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-2">Rooted device warnings</span>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block mb-1">Possible Duplicates</span>
            <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-500">{duplicateCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-2">Same-location captures flagged</span>
          </div>
        </div>

        {/* Proof logs listing table */}
        <ProofTable />
        
      </div>
    </DashboardLayout>
  );
}
