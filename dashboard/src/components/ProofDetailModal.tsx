'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

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

interface ProofDetailModalProps {
  proof: Proof;
  onClose: () => void;
}

export default function ProofDetailModal({ proof, onClose }: ProofDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasAlert = proof.mocked || proof.isRooted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-8 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]">
        {/* Left Side: Watermarked Image View */}
        <div className="lg:w-1/2 bg-slate-950 flex flex-col justify-between relative min-h-[300px] lg:min-h-0">
          <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${hasAlert ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs font-semibold text-slate-200">
              {proof.mocked ? 'Spoofed GPS Flagged' : proof.isRooted ? 'Compromised Device' : 'Verification Valid'}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <img 
              src={proof.imageUrl} 
              alt={`Proof ${proof.proofId}`} 
              className="max-h-[50vh] lg:max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
            />
          </div>

          <div className="bg-slate-950/90 border-t border-slate-800 p-4 text-center">
            <a 
              href={proof.imageUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1.5"
            >
              Open Original Image in New Tab ↗
            </a>
          </div>
        </div>

        {/* Right Side: Verification Logs & Map */}
        <div className="lg:w-1/2 flex flex-col h-full overflow-y-auto max-h-[90vh] lg:max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Verification Report</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">ID: {proof.proofId}</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-full transition-colors border border-slate-700"
            >
              ✕
            </button>
          </div>

          {/* Details & Telemetry */}
          <div className="p-6 space-y-6 flex-1">
            {/* Integrity Status Callout */}
            {proof.mocked ? (
              <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex gap-3.5">
                <span className="text-2xl mt-0.5">🚨</span>
                <div>
                  <h4 className="text-sm font-bold text-red-400">Mock Location Detected!</h4>
                  <p className="text-xs text-red-200/80 leading-5 mt-1">
                    The mobile device was using a GPS mock provider or spoofing application when this photo was saved. The reported coordinates are untrusted.
                  </p>
                </div>
              </div>
            ) : proof.isRooted ? (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 flex gap-3.5">
                <span className="text-2xl mt-0.5">⚠️</span>
                <div>
                  <h4 className="text-sm font-bold text-amber-400">Compromised Device Warning</h4>
                  <p className="text-xs text-amber-200/80 leading-5 mt-1">
                    A rooted or jailbroken operating system was detected. The integrity of the application binaries and hardware parameters cannot be fully guaranteed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 flex gap-3.5">
                <span className="text-2xl mt-0.5">🛡️</span>
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Secure & Verified</h4>
                  <p className="text-xs text-emerald-200/80 leading-5 mt-1">
                    GPS telemetry is certified authentic. Device software checks are secure. Image file binary matches the recorded SHA256 checksum.
                  </p>
                </div>
              </div>
            )}

            {/* Checksum and Proof Info */}
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">SHA256 CHECKSUM</span>
                <button 
                  onClick={() => copyToClipboard(proof.imageHash, 'hash')}
                  className="text-sky-400 hover:text-sky-300 font-sans font-medium text-[11px]"
                >
                  {copiedField === 'hash' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-slate-300 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {proof.imageHash}
              </p>
            </div>

            {/* General Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/30 border border-slate-800/50 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">GPS COORDINATES</span>
                <span className="text-sm font-semibold text-slate-200">
                  {proof.latitude.toFixed(6)}, {proof.longitude.toFixed(6)}
                </span>
              </div>

              <div className="bg-slate-950/30 border border-slate-800/50 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">GPS ACCURACY</span>
                <span className="text-sm font-semibold text-slate-200">
                  {proof.accuracy ? `±${proof.accuracy.toFixed(1)} meters` : 'Unknown'}
                </span>
              </div>

              <div className="bg-slate-950/30 border border-slate-800/50 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">CAPTURED TIMESTAMP</span>
                <span className="text-xs text-slate-200 font-medium">
                  {new Date(proof.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-950/30 border border-slate-800/50 p-4 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">DEVICE DETAILS</span>
                <span className="text-xs text-slate-200 font-medium block truncate">
                  {proof.deviceModel}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  OS: {proof.osVersion}
                </span>
              </div>
            </div>

            {/* Localized Map View */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Geographic Map</span>
              <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-slate-800">
                <MapComponent 
                  proofs={[proof]} 
                  center={[proof.latitude, proof.longitude]} 
                  zoom={15}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
