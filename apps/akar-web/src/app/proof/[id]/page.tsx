'use client';

import React, { use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useProof } from '../../../hooks/useProof';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { ShieldAlert, ShieldCheck, ArrowLeft, Calendar, MapPin, Compass, Cpu, Fingerprint, Map } from 'lucide-react';

const ProofMap = dynamic(() => import('../../../components/proofs/ProofMap'), { ssr: false });

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProofDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { data: proof, isLoading, error } = useProof(resolvedParams.id);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        
        {/* Navigation Back Button */}
        <div>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {isLoading && (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mb-4" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Retrieving proof records...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/10 border border-red-900/40 rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px] text-center">
            <ShieldAlert className="w-10 h-10 text-red-400 mb-4" />
            <h3 className="text-base font-bold text-red-200">Retrieval Failed</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              {error.message || 'An error occurred while loading this proof record.'}
            </p>
          </div>
        )}

        {!isLoading && !error && !proof && (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-16 flex flex-col items-center justify-center min-h-[400px] text-center">
            <ShieldAlert className="w-10 h-10 text-amber-500 mb-4" />
            <h3 className="text-base font-bold text-slate-200">Record Not Found</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              The verification proof ID you requested could not be found in Supabase.
            </p>
          </div>
        )}

        {proof && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Image Preview Area (7 Columns on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl relative">
                {proof.imageUrl ? (
                  <img 
                    src={proof.imageUrl} 
                    alt={`Verification Proof ${proof.proofId}`} 
                    className="w-full h-auto object-contain max-h-[500px] mx-auto"
                  />
                ) : (
                  <div className="aspect-4/3 flex items-center justify-center text-slate-500 bg-slate-950">
                    No image file associated with this record.
                  </div>
                )}
                
                {/* Floating status badge on image */}
                <div className="absolute top-4 right-4">
                  {proof.mockLocation ? (
                    <span className="inline-flex items-center gap-1.5 bg-red-950/90 backdrop-blur-sm text-red-400 border border-red-900 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Mock GPS Flagged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-950/90 backdrop-blur-sm text-emerald-400 border border-emerald-900 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Location Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata verification panel (5 Columns on desktop) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-6 shadow-xl space-y-6">
                
                {/* Panel Header */}
                <div>
                  <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block mb-1">
                    Proof Registry
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight font-mono select-all">
                    {proof.proofId}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                    Document registered in Supabase
                  </p>
                </div>

                <div className="w-full h-px bg-slate-800" />

                {/* Telemetry rows */}
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Captured Time</p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">
                        {proof.capturedAt ? new Date(proof.capturedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Coordinates</p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5 font-mono select-all">
                        {proof.latitude.toFixed(6)}, {proof.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Map className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Location</p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">
                        {[proof.city, proof.state, proof.country].filter(Boolean).join(', ') || 'Unknown location'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Device Model</p>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">
                        {proof.deviceModel || 'Unknown Device'} 
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">(v{proof.appVersion})</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-800" />

                {/* Secure Cryptographic Checksum details */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
                      SHA-256 Digest Match
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 break-all select-all leading-relaxed">
                    {proof.hash}
                  </p>
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    This cryptographic checksum is computed locally prior to file transfer to verify that image pixels have not been altered.
                  </span>
                </div>

              </div>

              {/* Map view matching telemetry coordinates */}
              <div className="h-64 rounded-3xl overflow-hidden border border-slate-800/60 bg-slate-900 shadow-xl relative">
                <ProofMap latitude={proof.latitude} longitude={proof.longitude} />
              </div>
            </div>
            
          </div>
        )}
        
      </div>
    </DashboardLayout>
  );
}
