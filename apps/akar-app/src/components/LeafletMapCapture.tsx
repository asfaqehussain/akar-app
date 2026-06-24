import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface LeafletMapCaptureProps {
  /** Decimal latitude */
  latitude: number;
  /** Decimal longitude */
  longitude: number;
  /** Map zoom level (default 16) */
  zoom?: number;
  /** Size of the map view in px (renders as a square) */
  size?: number;
  /** Called with the base64 PNG data URL when the map is captured */
  onMapCaptured: (base64DataUrl: string) => void;
  /** Called if capture fails */
  onError?: (error: string) => void;
}

/**
 * Renders a Leaflet + ESRI Satellite map inside a WebView,
 * waits for tiles to load, captures the map as a base64 PNG,
 * and returns it via onMapCaptured.
 *
 * This avoids the Android limitation where react-native-view-shot
 * cannot capture WebView content (separate hardware surface).
 */
export default function LeafletMapCapture({
  latitude,
  longitude,
  zoom = 16,
  size = 200,
  onMapCaptured,
  onError,
}: LeafletMapCaptureProps) {
  const webViewRef = useRef<WebView>(null);
  const [captured, setCaptured] = useState(false);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapCaptured' && data.base64) {
        setCaptured(true);
        onMapCaptured(data.base64);
      } else if (data.type === 'error') {
        onError?.(data.message || 'Map capture failed');
      }
    } catch (err) {
      onError?.('Failed to parse map capture message');
    }
  };

  const htmlContent = generateLeafletHTML(latitude, longitude, zoom);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {!captured && (
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={[styles.webview, { width: size, height: size }]}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
          onError={() => onError?.('WebView failed to load')}
          androidLayerType="software"
          originWhitelist={['*']}
        />
      )}
    </View>
  );
}

/**
 * Generates the inline HTML for the Leaflet map.
 * After tiles load, it draws all tile images onto an offscreen canvas,
 * adds a marker pin, and posts the base64 result back.
 */
function generateLeafletHTML(lat: number, lng: number, zoom: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var lat = ${lat};
      var lng = ${lng};
      var zoom = ${zoom};

      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([lat, lng], zoom);

      var tileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, crossOrigin: true }
      ).addTo(map);

      // Custom red pin marker
      var pinIcon = L.divIcon({
        html: '<div style="width:20px;height:20px;position:relative;">' +
              '<div style="width:14px;height:14px;background:#FF3B30;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5);position:absolute;top:0;left:3px;"></div>' +
              '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid #FF3B30;position:absolute;bottom:-4px;left:5px;"></div>' +
              '</div>',
        className: '',
        iconSize: [20, 24],
        iconAnchor: [10, 24],
      });
      L.marker([lat, lng], { icon: pinIcon }).addTo(map);

      // Wait for tiles to load, then capture
      var captureAttempted = false;
      tileLayer.on('load', function() {
        if (captureAttempted) return;
        captureAttempted = true;
        // Small delay to ensure rendering is complete
        setTimeout(captureMap, 600);
      });

      // Fallback timeout in case 'load' doesn't fire
      setTimeout(function() {
        if (!captureAttempted) {
          captureAttempted = true;
          captureMap();
        }
      }, 5000);

      function captureMap() {
        try {
          var mapContainer = document.getElementById('map');
          var canvas = document.createElement('canvas');
          var rect = mapContainer.getBoundingClientRect();
          canvas.width = rect.width * 2;  // 2x for retina quality
          canvas.height = rect.height * 2;
          var ctx = canvas.getContext('2d');
          ctx.scale(2, 2);

          // Draw all tile images
          var tiles = mapContainer.querySelectorAll('.leaflet-tile-loaded');
          var tilePromises = [];

          tiles.forEach(function(tile) {
            if (tile.tagName === 'IMG' && tile.complete) {
              var tileStyle = window.getComputedStyle(tile);
              var transform = tileStyle.transform || tileStyle.webkitTransform;
              var tileRect = tile.getBoundingClientRect();
              var x = tileRect.left - rect.left;
              var y = tileRect.top - rect.top;
              try {
                ctx.drawImage(tile, x, y, tileRect.width, tileRect.height);
              } catch(e) {
                // CORS error — skip tile
              }
            }
          });

          // Draw the marker pin
          var markerEl = mapContainer.querySelector('.leaflet-marker-icon');
          if (markerEl) {
            var markerRect = markerEl.getBoundingClientRect();
            var mx = markerRect.left - rect.left;
            var my = markerRect.top - rect.top;
            
            // Draw red circle
            var pinX = mx + 10;
            var pinY = my + 9;
            ctx.beginPath();
            ctx.arc(pinX, pinY, 7, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF3B30';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw pin point
            ctx.beginPath();
            ctx.moveTo(pinX - 5, pinY + 5);
            ctx.lineTo(pinX, pinY + 14);
            ctx.lineTo(pinX + 5, pinY + 5);
            ctx.fillStyle = '#FF3B30';
            ctx.fill();
          }

          var base64 = canvas.toDataURL('image/png');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapCaptured',
            base64: base64,
          }));
        } catch(err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: err.message || 'Canvas capture failed',
          }));
        }
      }
    })();
  </script>
</body>
</html>
  `.trim();
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
