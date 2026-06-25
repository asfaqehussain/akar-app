import React, { useState } from 'react';
import { useProofs } from '../../hooks/useProofs';
import { ShieldAlert, ShieldCheck, Search, AlertTriangle, Copy, Smartphone } from 'lucide-react';
import Pagination from '../Pagination';
import ImageModal from '../ImageModal';

export default function ProofTable() {
  const { data: proofs, isLoading, error } = useProofs();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mb-4" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Loading verification logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[300px] text-center">
        <ShieldAlert className="w-8 h-8 text-red-500 dark:text-red-400 mb-3" />
        <h4 className="text-sm font-bold text-red-700 dark:text-red-200">Failed to load proofs</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
          {error.message || 'An unexpected error occurred while communicating with Supabase.'}
        </p>
      </div>
    );
  }

  if (!proofs || proofs.length === 0) {
    return (
      <div className="w-full bg-white/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-850">
          <span className="text-slate-400 text-lg">📁</span>
        </div>
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">No proofs logged yet</h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-sm leading-relaxed">
          Once mechanic uploads are registered via the mobile application, they will appear here in real-time.
        </p>
      </div>
    );
  }


  // Filter proofs by city/state locally on the client
  const filteredProofs = proofs.filter((proof) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      proof.city?.toLowerCase().includes(query) ||
      proof.state?.toLowerCase().includes(query) ||
      proof.country?.toLowerCase().includes(query)
    );
  });

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(filteredProofs.length / PAGE_SIZE);
  const paginatedProofs = filteredProofs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Helper to compute flag badges for a proof
  const getProofFlags = (proof: typeof proofs[0]) => {
    const flags: { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }[] = [];

    if (proof.mockLocation) {
      flags.push({
        label: 'Suspicious Location',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/40',
        borderColor: 'border-red-200 dark:border-red-900/60',
        icon: <ShieldAlert className="w-3 h-3 text-red-600 dark:text-red-400" />,
      });
    }

    if (proof.isRooted) {
      flags.push({
        label: 'Rooted Device',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        borderColor: 'border-amber-200 dark:border-amber-900/60',
        icon: <Smartphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
      });
    }

    if (proof.duplicateProof) {
      flags.push({
        label: 'Possible Duplicate',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        borderColor: 'border-orange-200 dark:border-orange-900/60',
        icon: <Copy className="w-3 h-3 text-orange-600 dark:text-orange-400" />,
      });
    }

    if (proof.accuracyTier === 'poor') {
      flags.push({
        label: 'Poor Accuracy',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/40',
        borderColor: 'border-red-200 dark:border-red-900/60',
        icon: <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />,
      });
    } else if (proof.accuracyTier === 'warning') {
      flags.push({
        label: 'Low Accuracy',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        borderColor: 'border-amber-200 dark:border-amber-900/60',
        icon: <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
      });
    }

    return flags;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-3xl shadow-xl overflow-hidden space-y-4">
      {/* Header and Search toolbar */}
      <div className="px-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span>Verification Logs</span>
          <span className="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            {proofs.length} total
          </span>
        </h3>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by city or state..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-300 dark:focus:border-slate-700 transition-colors"
          />
        </div>
      </div>

      {filteredProofs.length === 0 ? (
        <div className="px-6 py-16 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/80">
          <Search className="w-8 h-8 text-slate-400 dark:text-slate-650 mb-3" />
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">No matching records found</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            No proofs match your location search query: &quot;{searchQuery}&quot;.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-950/20">
                <th className="py-4 px-6">Thumbnail</th>
                <th className="py-4 px-6">City</th>
                <th className="py-4 px-6">State</th>
                <th className="py-4 px-6">Captured Time</th>
                <th className="py-4 px-6">Latitude</th>
                <th className="py-4 px-6">Longitude</th>
                <th className="py-4 px-6">Accuracy</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
              {paginatedProofs.map((proof) => {
                const flags = getProofFlags(proof);
                const hasAlert = flags.length > 0;
                return (
                  <tr 
                    key={proof.proofId} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150 group"
                  >
                    {/* Thumbnail */}
                    <td className="py-3.5 px-6">
                      {proof.imageUrl ? (
                        <button 
                          onClick={() => setActiveModalImage(proof.imageUrl)}
                          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 overflow-hidden relative shadow-inner hover:border-sky-500/50 transition-all cursor-zoom-in block"
                        >
                          <img 
                            src={proof.imageUrl} 
                            alt={`Proof ${proof.proofId}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 overflow-hidden flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
                          📷
                        </div>
                      )}
                    </td>

                    {/* City */}
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      {proof.city || '—'}
                    </td>

                    {/* State */}
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 text-[11px]">
                      {proof.state || '—'}
                    </td>

                    {/* Captured Time */}
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 font-medium">
                      {proof.capturedAt ? new Date(proof.capturedAt).toLocaleString() : 'N/A'}
                    </td>

                    {/* Latitude */}
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {proof.latitude !== undefined ? proof.latitude.toFixed(6) : '0.000000'}
                    </td>

                    {/* Longitude */}
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {proof.longitude !== undefined ? proof.longitude.toFixed(6) : '0.000000'}
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ±{proof.accuracy?.toFixed(0) || '?'}m
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          proof.accuracyTier === 'good' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60' 
                            : proof.accuracyTier === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                        }`}>
                          {proof.accuracyTier || 'good'}
                        </span>
                      </div>
                    </td>

                    {/* Status — Multi-Badge System */}
                    <td className="py-3.5 px-6">
                      {hasAlert ? (
                        <div className="flex flex-col gap-1.5">
                          {flags.map((flag, i) => (
                            <span 
                              key={i}
                              className={`inline-flex items-center gap-1.5 ${flag.bgColor} ${flag.color} border ${flag.borderColor} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap`}
                            >
                              {flag.icon}
                              {flag.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination controls */}
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      )}

      {/* Image Modal viewer */}
      {activeModalImage && (
        <ImageModal 
          imageUrl={activeModalImage} 
          onClose={() => setActiveModalImage(null)} 
        />
      )}
    </div>
  );
}
