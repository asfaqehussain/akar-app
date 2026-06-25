'use client';

import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'proof-image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm transition-opacity duration-300">
      
      {/* Clickable backdrop overlay to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-55 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-16 z-55 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
      >
        <Download className="w-6 h-6" />
      </button>

      {/* Image Frame */}
      <div className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center z-55">
        <img 
          src={imageUrl} 
          alt="Full Size Verification Proof" 
          className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl select-none pointer-events-none"
        />
      </div>

    </div>
  );
}
