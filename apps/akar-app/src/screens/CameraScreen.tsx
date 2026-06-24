import { NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Camera, CameraRef, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { loadImage } from 'react-native-nitro-image';
import * as Location from 'expo-location';
import { computeSHA256 } from '../../utils/security';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { RootStackParamList } from '../navigation/RootNavigator';
import { formatTimestamp } from '../utils/formatTimestamp';
import { generateWatermarkText } from '../utils/generateWatermarkText';
import { encodePlusCode } from '../utils/plusCode';
import LeafletMapCapture from '../components/LeafletMapCapture';
import WatermarkOverlay from '../components/WatermarkOverlay';

export default function CameraScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { location, loading: locationLoading, errorMsg: locationError, refetchLocation } = useCurrentLocation();
  const photoOutput = usePhotoOutput();

  const [isCapturing, setIsCapturing] = useState(false);

  // ViewShot and mapping state
  const viewShotRef = useRef<ViewShot>(null);
  const [mapBase64, setMapBase64] = useState<string | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // Live watermark popup state
  const [reverseGeoPlace, setReverseGeoPlace] = useState<string>('');
  const [reverseGeoAddress, setReverseGeoAddress] = useState<string>('');
  const [plusCodePreview, setPlusCodePreview] = useState<string>('');
  const [liveTimestamp, setLiveTimestamp] = useState<string>(formatTimestamp(new Date()));

  // Reverse geocode when location changes
  useEffect(() => {
    if (!location) return;
    setPlusCodePreview(encodePlusCode(location.latitude, location.longitude));

    (async () => {
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        if (geocode && geocode.length > 0) {
          const geo = geocode[0];
          const city = geo.city || geo.subregion || '';
          const region = geo.region || '';
          const country = geo.country || '';
          setReverseGeoPlace([city, region, country].filter(Boolean).join(', '));
          const postalCode = geo.postalCode || '';
          setReverseGeoAddress([city, `${region} ${postalCode}`.trim(), country].filter(Boolean).join(', '));
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      }
    })();
  }, [location]);

  // Update live timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTimestamp(formatTimestamp(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera is not ready yet');
      return;
    }

    if (!location) {
      Alert.alert('Location Required', 'Waiting for a valid GPS coordinate fix. Please try again in a few seconds.');
      return;
    }

    setIsCapturing(true);

    try {
      // 1. Capture photo
      const photoFile = await photoOutput.capturePhotoToFile({
        flashMode: 'off',
      }, {});

      const rawPhotoUri = `file://${photoFile.filePath}`;

      // 2. Pass raw photo to state so WatermarkOverlay renders it
      setCapturedPhotoUri(rawPhotoUri);

      // Wait a moment for React to mount the WatermarkOverlay and lay it out
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref is not ready');
      }

      // 3. Capture the composite WatermarkOverlay View as a screenshot
      const markedImagePath = await viewShotRef.current.capture();

      // Reset state so it unmounts
      setCapturedPhotoUri(null);

      // 8. Generate metadata parameters and calculate checksum
      const proofId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const capturedAt = new Date().toISOString();

      const nitroImage = await loadImage({ filePath: markedImagePath });
      const encodedData = await nitroImage.toEncodedImageDataAsync('jpg', 95);
      const fileHash = await computeSHA256(encodedData.buffer);

      setIsCapturing(false);

      // 9. Navigate to Preview screen with flat parameters structure
      navigation.navigate('Preview', {
        imagePath: markedImagePath,
        proofId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        capturedAt,
        hash: fileHash,
      });

    } catch (error: any) {
      console.error('Capture flow failed:', error);
      Alert.alert('Capture Failed', error?.message || 'Failed to capture and process proof photo.');
      setIsCapturing(false);
    }
  };

  // 1. Permission request view
  if (!hasCameraPermission) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.title}>Camera Access Required</Text>
          <Text style={styles.subtitle}>
            We need your camera permission to capture mechanic verification photo proofs.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>No back camera device found on this device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Off-screen Map Renderer */}
      {location && (
        <View style={styles.hiddenRenderer}>
          <LeafletMapCapture
            latitude={location.latitude}
            longitude={location.longitude}
            onMapCaptured={setMapBase64}
          />
        </View>
      )}

      {/* Off-screen ViewShot Composite Renderer */}
      {capturedPhotoUri && location && (
        <View style={styles.hiddenRendererViewShot}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <WatermarkOverlay
              photoUri={capturedPhotoUri}
              mapBase64={mapBase64}
              placeName={reverseGeoPlace || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              fullAddress={reverseGeoAddress ? `${plusCodePreview}, ${reverseGeoAddress}` : plusCodePreview}
              plusCode={plusCodePreview}
              latitude={location.latitude}
              longitude={location.longitude}
              timestamp={liveTimestamp}
            />
          </ViewShot>
        </View>
      )}

      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        outputs={[photoOutput]}
        isActive={isFocused}
      />

      {/* Bottom watermark preview popup */}
      <View style={styles.watermarkPopup}>
        <View style={styles.watermarkCard}>
          {location ? (
            <>
              <Text style={styles.watermarkPlaceName}>
                {reverseGeoPlace || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
              </Text>
              <Text style={styles.watermarkAddress}>
                {reverseGeoAddress
                  ? `${plusCodePreview}, ${reverseGeoAddress}`
                  : plusCodePreview}
              </Text>
              <Text style={styles.watermarkCoords}>
                Lat {location.latitude.toFixed(6)}° Long {location.longitude.toFixed(6)}°
              </Text>
              <Text style={styles.watermarkTimestamp}>
                {liveTimestamp}
              </Text>
            </>
          ) : (
            <View style={styles.gpsOfflineContainer}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, styles.dotWaiting]} />
                <Text style={styles.watermarkTimestamp}>
                  {locationLoading ? 'Acquiring GPS Fix...' : 'GPS Offline'}
                </Text>
              </View>
              {locationError && (
                <Text style={styles.watermarkCoords}>{locationError}</Text>
              )}
              <TouchableOpacity style={styles.retryGpsButton} onPress={refetchLocation}>
                <Text style={styles.retryGpsText}>Refresh GPS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Shutter controls */}
      <View style={styles.shutterContainer}>
        {isCapturing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <TouchableOpacity
            style={[styles.shutterButton, !location && styles.shutterDisabled]}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={!location}
          >
            <View style={[styles.shutterInner, !location && styles.shutterInnerDisabled]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Hidden renderers for watermarking
  hiddenRenderer: {
    position: 'absolute',
    top: -5000, // Move way off screen
    left: -5000,
  },
  hiddenRendererViewShot: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: 'none', // Prevent interaction but allow view-shot to capture
    zIndex: -1,
  },
  // Bottom watermark popup
  watermarkPopup: {
    position: 'absolute',
    bottom: 140,
    left: 12,
    right: 12,
  },
  watermarkCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  watermarkPlaceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  watermarkAddress: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
    marginBottom: 3,
  },
  watermarkCoords: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 3,
  },
  watermarkTimestamp: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  // GPS offline state
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotWaiting: {
    backgroundColor: '#FBBF24',
  },
  gpsOfflineContainer: {
    alignItems: 'flex-start',
  },
  retryGpsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 6,
  },
  retryGpsText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  // Shutter
  shutterContainer: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterDisabled: {
    borderColor: '#64748B',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  shutterInnerDisabled: {
    backgroundColor: '#64748B',
  },
});

