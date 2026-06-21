'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in Next.js dynamic routing
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom colored icons for alerts
const alertIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

interface MapComponentProps {
  proofs: Proof[];
  center?: [number, number];
  zoom?: number;
  onSelectProof?: (proof: Proof) => void;
}

export default function MapComponent({ proofs, center, zoom = 3, onSelectProof }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      const initialCenter = center || [20, 0];
      const initialZoom = center ? 14 : zoom;
      
      mapRef.current = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      // Clean up map instance on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom if center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView(center, zoom || 14, { animate: true });
    }
  }, [center, zoom]);

  // Update markers when proofs list changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers
    proofs.forEach((proof) => {
      if (typeof proof.latitude !== 'number' || typeof proof.longitude !== 'number') return;
      if (isNaN(proof.latitude) || isNaN(proof.longitude)) return;

      const hasAlert = proof.mocked || proof.isRooted;
      const marker = L.marker([proof.latitude, proof.longitude], {
        icon: hasAlert ? alertIcon : defaultIcon,
      });

      const popupContent = `
        <div style="font-family: sans-serif; color: #1E293B; min-width: 150px; padding: 4px;">
          <h4 style="margin: 0 0 6px 0; font-weight: 700; font-size: 13px;">Proof ${proof.proofId.substring(0, 8)}...</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px;"><b>Device:</b> ${proof.deviceModel}</p>
          <p style="margin: 0 0 4px 0; font-size: 11px;"><b>GPS:</b> ${proof.latitude.toFixed(5)}, ${proof.longitude.toFixed(5)}</p>
          ${proof.mocked ? '<p style="margin: 4px 0 0 0; color: #EF4444; font-size: 11px; font-weight: bold;">⚠️ Mock Location</p>' : ''}
          ${proof.isRooted ? '<p style="margin: 4px 0 0 0; color: #EF4444; font-size: 11px; font-weight: bold;">⚠️ Device Rooted</p>' : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onSelectProof) {
        marker.on('click', () => {
          onSelectProof(proof);
        });
      }

      markersLayerRef.current?.addLayer(marker);
    });

    // Fit bounds if no custom center is provided and we have multiple points
    if (!center && proofs.length > 0 && mapRef.current) {
      const validPoints = proofs
        .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude))
        .map(p => L.latLng(p.latitude, p.longitude));

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [proofs, center, onSelectProof]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
      style={{ zIndex: 1 }}
    />
  );
}
