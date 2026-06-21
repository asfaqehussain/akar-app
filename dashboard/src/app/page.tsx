'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ProofDetailModal from '../components/ProofDetailModal';

// Load map component client-side only to bypass Next.js SSR
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false });

interface Proof {
  proofId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  mocked: boolean;
  imageHash: string;
  isRooted: boolean;
  deviceName: string;
  deviceModel: string;
  osVersion: string;
  imageUrl: string;
  createdAt: string;
}

// Pre-populated demonstration data for immediate out-of-the-box preview
const DEMO_PROOFS: Proof[] = [
  {
    proofId: "p5b9e2a4f7831d04",
    timestamp: "2026-06-18T12:00:00.000Z",
    latitude: 37.774929,
    longitude: -122.419416,
    altitude: 15.4,
    accuracy: 4.8,
    mocked: false,
    imageHash: "8f48cf6c41b8a53dbd7e937d9be7051838d781bd992e59df0129b28a2a8c3d9a",
    isRooted: false,
    deviceName: "Technician Pixel 7",
    deviceModel: "Google Pixel 7 Pro",
    osVersion: "Android 13.0",
    imageUrl: "https://picsum.photos/seed/proof1/800/600",
    createdAt: "2026-06-18T12:01:10.000Z"
  },
  {
    proofId: "p8a2e1d0f5b9e783",
    timestamp: "2026-06-18T12:15:30.000Z",
    latitude: 37.7833,
    longitude: -122.4167,
    altitude: 22.1,
    accuracy: 3.2,
    mocked: true, // Spoofed alert
    imageHash: "7b4c6b22cbb54d7e98a3c897f2c69b2d87e6b8c9d1a3c7a2b9a7c6f2e8d1a2c3",
    isRooted: false,
    deviceName: "Field Engineer S23",
    deviceModel: "Samsung Galaxy S23",
    osVersion: "Android 14.0",
    imageUrl: "https://picsum.photos/seed/proof2/800/600",
    createdAt: "2026-06-18T12:17:05.000Z"
  },
  {
    proofId: "p3f8e5d2b9a1c0f4",
    timestamp: "2026-06-18T12:30:15.000Z",
    latitude: 37.7699,
    longitude: -122.4468,
    altitude: 45.0,
    accuracy: 12.5,
    mocked: false,
    imageHash: "e5d2b9a1c0f48f48cf6c41b8a53dbd7e937d9be7051838d781bd992e59df0129",
    isRooted: true, // Compromised warning
    deviceName: "Mech Pro A54",
    deviceModel: "Samsung Galaxy A54 (Rooted)",
    osVersion: "Android 12.0",
    imageUrl: "https://picsum.photos/seed/proof3/800/600",
    createdAt: "2026-06-18T12:32:00.000Z"
  }
];

export default function DashboardPage() {
  const [proofs, setProofs] = useState<Proof[]>(DEMO_PROOFS);
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:8787');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAlertsOnly, setFilterAlertsOnly] = useState<boolean>(false);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(true);

  const fetchProofsFromBackend = async (urlToFetch: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`${urlToFetch}/api/proofs`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json() as Proof[];
      
      if (Array.isArray(data) && data.length > 0) {
        setProofs(data);
        setIsUsingDemoData(false);
      } else {
        // Fallback to demo if empty
        setProofs(DEMO_PROOFS);
        setIsUsingDemoData(true);
      }
    } catch (err: any) {
      console.warn('Backend fetch failed, using demo fallback:', err);
      setFetchError(`Could not connect to backend at ${urlToFetch}. Displaying sample demonstration data.`);
      setProofs(DEMO_PROOFS);
      setIsUsingDemoData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProofsFromBackend(backendUrl);
  }, []);

  const handleRefresh = () => {
    fetchProofsFromBackend(backendUrl);
  };

  // Filter logic
  const filteredProofs = proofs.filter((proof) => {
    const matchesSearch = proof.proofId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          proof.deviceModel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAlertFilter = filterAlertsOnly ? (proof.mocked || proof.isRooted) : true;

    return matchesSearch && matchesAlertFilter;
  });

  // Calculate high-fidelity counters
  const totalCount = proofs.length;
  const mockGpsCount = proofs.filter(p => p.mocked).length;
  const rootedCount = proofs.filter(p => p.isRooted).length;
  const cleanCount = proofs.filter(p => !p.mocked && !p.isRooted).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Navbar Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
            Field Proof Capture Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Automated image-hashing & secure location verification</p>
        </div>

        {/* Worker URL configuration */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 w-full md:w-80">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Worker URL</span>
            <input 
              type="text" 
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono"
            />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium px-4 py-2.5 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? 'Loading...' : 'Fetch'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Warning notification banner if using fallback demo data */}
        {fetchError && (
          <div className="bg-slate-900/80 border border-slate-850 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <span>{fetchError}</span>
            </div>
            <button 
              onClick={() => setFetchError(null)}
              className="hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Uploads</span>
            <span className="text-3xl font-extrabold text-white">{totalCount}</span>
            <span className="text-[10px] text-slate-500 block mt-2">Captured proofs registered</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verified Secure</span>
            <span className="text-3xl font-extrabold text-emerald-400">{cleanCount}</span>
            <span className="text-[10px] text-slate-500 block mt-2">100% integrity match</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GPS Spoofs</span>
            <span className={`text-3xl font-extrabold ${mockGpsCount > 0 ? 'text-red-500' : 'text-slate-300'}`}>
              {mockGpsCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-2">Mock locations flagged</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Device Alerts</span>
            <span className={`text-3xl font-extrabold ${rootedCount > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
              {rootedCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-2">Rooted OS warnings</span>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <input 
              type="text"
              placeholder="Search by ID or Device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs w-full text-slate-200 placeholder-slate-500 focus:border-slate-700 outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 w-full sm:w-auto">
            <input 
              type="checkbox"
              checked={filterAlertsOnly}
              onChange={(e) => setFilterAlertsOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-red-500 bg-slate-950 border-slate-800"
            />
            <span className="text-xs text-slate-300">Show Alerts / Warnings Only</span>
          </label>
        </div>

        {/* Dashboard Split Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Proof Grid List (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Proofs Log</h3>
              
              {filteredProofs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <span className="text-2xl mb-2">🔍</span>
                  <p className="text-xs font-semibold">No records found matching filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="pb-3 pr-2">ID</th>
                        <th className="pb-3 pr-2">Timestamp</th>
                        <th className="pb-3 pr-2">Coordinates</th>
                        <th className="pb-3 pr-2">Status</th>
                        <th className="pb-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProofs.map((proof) => {
                        const hasAlert = proof.mocked || proof.isRooted;
                        return (
                          <tr key={proof.proofId} className="border-b border-slate-850 hover:bg-slate-850/30 transition-colors">
                            <td className="py-4 pr-2 font-mono text-[11px] font-semibold text-slate-300">
                              {proof.proofId.substring(0, 8)}...
                            </td>
                            <td className="py-4 pr-2 text-slate-400">
                              {new Date(proof.timestamp).toLocaleString()}
                            </td>
                            <td className="py-4 pr-2 text-slate-400 font-mono text-[11px]">
                              {proof.latitude.toFixed(4)}, {proof.longitude.toFixed(4)}
                            </td>
                            <td className="py-4 pr-2">
                              {proof.mocked ? (
                                <span className="bg-red-950/50 text-red-400 border border-red-900/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  Spoof Alert
                                </span>
                              ) : proof.isRooted ? (
                                <span className="bg-amber-950/50 text-amber-400 border border-amber-900/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  Compromised
                                </span>
                              ) : (
                                <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  Verified
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => setSelectedProof(proof)}
                                className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors border border-slate-750"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Map Section (5 Cols) */}
          <div className="lg:col-span-5 h-[400px] lg:h-auto min-h-[400px] flex flex-col">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Global Proof Locations</h3>
              <div className="flex-1 w-full h-full relative">
                <MapComponent 
                  proofs={filteredProofs} 
                  onSelectProof={(proof) => setSelectedProof(proof)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Details View Modal */}
      {selectedProof && (
        <ProofDetailModal 
          proof={selectedProof} 
          onClose={() => setSelectedProof(null)} 
        />
      )}
    </div>
  );
}
