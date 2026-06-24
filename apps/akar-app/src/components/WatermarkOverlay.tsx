import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, View, Dimensions } from 'react-native';

interface WatermarkOverlayProps {
  /** Local file URI of the captured photo */
  photoUri: string;
  /** Base64 data URL of the Leaflet map capture (or null if not ready) */
  mapBase64: string | null;
  /** Reverse-geocoded short place name */
  placeName: string;
  /** Full address with postal code */
  fullAddress: string;
  /** Open Location Code */
  plusCode: string;
  /** Decimal latitude */
  latitude: number;
  /** Decimal longitude */
  longitude: number;
  /** Pre-formatted timestamp string */
  timestamp: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Render at a fixed high-res size for quality captures
const CAPTURE_WIDTH = 1080;
const MAP_SIZE = 180;

/**
 * Renders the full composite view: photo background + watermark overlay.
 * This View is captured by react-native-view-shot to produce the final watermarked image.
 *
 * Uses forwardRef so the parent can pass a ref for captureRef().
 */
const WatermarkOverlay = forwardRef<View, WatermarkOverlayProps>(
  (
    {
      photoUri,
      mapBase64,
      placeName,
      fullAddress,
      plusCode,
      latitude,
      longitude,
      timestamp,
    },
    ref,
  ) => {
    const normalizedUri = photoUri.startsWith('file://') ? photoUri : `file://${photoUri}`;

    return (
      <View ref={ref} style={styles.captureContainer} collapsable={false}>
        {/* Full photo background */}
        <Image
          source={{ uri: normalizedUri }}
          style={styles.photoImage}
          resizeMode="cover"
        />

        {/* Bottom watermark overlay */}
        <View style={styles.overlayContainer}>
          <View style={styles.overlayContent}>
            {/* Left: Map thumbnail */}
            <View style={styles.mapContainer}>
              {mapBase64 ? (
                <Image
                  source={{ uri: mapBase64 }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>📍</Text>
                </View>
              )}
              {/* Pin marker overlay (in case base64 doesn't include pin) */}
              <View style={styles.pinOverlay}>
                <View style={styles.pinCircle} />
                <View style={styles.pinPoint} />
              </View>
            </View>

            {/* Right: Text details */}
            <View style={styles.textContainer}>
              <Text style={styles.placeNameText} numberOfLines={1}>
                {placeName}
              </Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {plusCode}, {fullAddress}
              </Text>
              <Text style={styles.coordsText}>
                Lat {latitude.toFixed(6)}° Long {longitude.toFixed(6)}°
              </Text>
              <Text style={styles.timestampText}>{timestamp}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

WatermarkOverlay.displayName = 'WatermarkOverlay';
export default WatermarkOverlay;

const styles = StyleSheet.create({
  captureContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 3 / 4, // Typical photo aspect ratio
    backgroundColor: '#000',
    position: 'relative',
  },
  photoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  // Bottom overlay bar
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Map thumbnail
  mapContainer: {
    width: MAP_SIZE * 0.45,
    height: MAP_SIZE * 0.45,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#1a1a2e',
    marginRight: 12,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  mapPlaceholderText: {
    fontSize: 28,
  },
  pinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -7,
    alignItems: 'center',
  },
  pinCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF3B30',
    marginTop: -1,
  },
  // Text info
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  placeNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 2,
    lineHeight: 14,
  },
  coordsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 2,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D1D5DB',
  },
});
