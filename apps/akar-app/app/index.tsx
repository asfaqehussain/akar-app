import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput, CameraRef } from 'react-native-vision-camera';
import * as Sharing from 'expo-sharing';
import { useLocation } from '@/hooks/use-location';
import { checkDeviceSecurity, computeSHA256, arrayBufferToHex } from '@/utils/security';
import { uploadProof, DEFAULT_BACKEND_URL } from '@/services/upload';
import { loadImage } from 'react-native-nitro-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import LeafletMapCapture from '@/src/components/LeafletMapCapture';
import WatermarkOverlay from '@/src/components/WatermarkOverlay';
import { encodePlusCode } from '@/src/utils/plusCode';
import * as Location from 'expo-location';
import { formatTimestamp } from '@/src/utils/formatTimestamp';
import { useRouter } from 'expo-router';
import { useUploadStore } from '@/src/store/useUploadStore';
import { processUploadQueue } from '@/src/services/uploadQueue';
import { classifyAccuracy, checkSameLocationBlock, checkDuplicateCoordinates, AccuracyTier } from '@/src/utils/proofValidation';

export default function CameraScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const device = useCameraDevice('back');
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput();
  
  const {
    location,
    loading: locationLoading,
    error: locationError,
    permissionGranted: hasLocationPermission,
    fetchLocation,
  } = useLocation();

  const router = useRouter();
  const [permissionCheckComplete, setPermissionCheckComplete] = useState<boolean>(false);
  
  // Zustand queue
  const uploads = useUploadStore((state) => state.items);
  const uploadingCount = uploads.filter(i => i.status === 'uploading' || i.status === 'pending').length;

  // ViewShot and mapping state
  const viewShotRef = useRef<any>(null);
  const [mapBase64, setMapBase64] = useState<string | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<any>(null);

  // Real-time security telemetry
  const [securityData, setSecurityData] = useState<{
    isRooted: boolean;
    deviceName: string;
    deviceModel: string;
    osVersion: string;
  } | null>(null);

  // Custom configuration API endpoint URL
  const [backendUrl, setBackendUrl] = useState<string>(DEFAULT_BACKEND_URL);

  useEffect(() => {
    // Check security status on mount
    (async () => {
      try {
        const sec = await checkDeviceSecurity();
        setSecurityData(sec);
      } catch (err) {
        console.error('Security check error:', err);
      } finally {
        setPermissionCheckComplete(true);
      }
    })();
  }, []);

  const triggerPermissionRequest = async () => {
    await requestCameraPermission();
    await fetchLocation();
  };

  const handleCapturePipeline = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera viewfinder is not ready.');
      return;
    }

    try {
      // Step 1: Capture Location (fast)
      const gps = await fetchLocation();
      if (!gps) {
        throw new Error('Failed to acquire location. Ensure location services are enabled.');
      }

      // Step 2: GPS Accuracy Validation (Rule 5)
      const accuracyTier = classifyAccuracy(gps.accuracy);
      if (accuracyTier === 'poor') {
        Alert.alert(
          'Low GPS Accuracy',
          `Current GPS accuracy is ±${gps.accuracy?.toFixed(0) || '?'}m (>50m). The proof will be flagged as low accuracy. Consider moving to an open area for better signal.`,
        );
      } else if (accuracyTier === 'warning') {
        Alert.alert(
          'GPS Accuracy Warning',
          `Current GPS accuracy is ±${gps.accuracy?.toFixed(0) || '?'}m (20-50m). The proof will be flagged with reduced accuracy.`,
        );
      }

      // Step 3: Same-Location Block — prevent capturing at identical coordinates
      const isSameLocation = checkSameLocationBlock(gps.latitude, gps.longitude);
      if (isSameLocation) {
        Alert.alert(
          'Same Location Detected',
          'A proof has already been captured at this location. Please move to a different position (at least 5 meters away) before capturing another proof.',
        );
        return; // BLOCK capture
      }

      // Step 4: Capture Photo
      const photoFile = await photoOutput.capturePhotoToFile({
        flashMode: 'off',
      }, {});

      // Generate a Unique Proof ID
      const proofId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();
      const captureTimestamp = Date.now();

      // Step 5: Duplicate Proof Detection (Rule 11) — same device + <5m + <1min
      const isDuplicate = await checkDuplicateCoordinates(gps.latitude, gps.longitude, captureTimestamp);
      
      // Reverse geocode
      let placeName = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`;
      let fullAddress = '';
      let gcCity = '';
      let gcState = '';
      let gcCountry = '';

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: gps.latitude,
          longitude: gps.longitude,
        });
        if (geocode && geocode.length > 0) {
          const geo = geocode[0];
          gcCity = geo.city || geo.subregion || '';
          gcState = geo.region || '';
          gcCountry = geo.country || '';
          placeName = [gcCity, gcState, gcCountry].filter(Boolean).join(', ');
          fullAddress = [gcCity, `${gcState} ${geo.postalCode || ''}`.trim(), gcCountry].filter(Boolean).join(', ');
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError);
      }
      
      const plusCodePreview = encodePlusCode(gps.latitude, gps.longitude);
      
      const actualWidth = photoFile.width;
      const actualHeight = photoFile.height;
      const aspectRatio = actualHeight > actualWidth ? actualWidth / actualHeight : actualHeight / actualWidth;

      setWatermarkData({
         placeName,
         fullAddress: fullAddress ? `${plusCodePreview}, ${fullAddress}` : plusCodePreview,
         plusCode: plusCodePreview,
         latitude: gps.latitude,
         longitude: gps.longitude,
         timestamp: formatTimestamp(new Date()),
         aspectRatio,
      });
      setCapturedPhotoUri(`file://${photoFile.filePath}`);
      
      // Wait a moment for React to mount the WatermarkOverlay and lay it out
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref is not ready');
      }

      // Capture the composite WatermarkOverlay View as a screenshot
      const watermarkedPath = await viewShotRef.current.capture();
      
      // Reset state so it unmounts
      setCapturedPhotoUri(null);

      // Queue the background upload
      const sec = securityData || {
        isRooted: false,
        deviceName: 'Unknown',
        deviceModel: 'Unknown Device',
        osVersion: 'Unknown',
      };

      useUploadStore.getState().addUpload({
        id: proofId,
        localUri: watermarkedPath,
        status: 'pending',
        createdAt: captureTimestamp,
        metadata: {
          proofId,
          timestamp,
          latitude: gps.latitude,
          longitude: gps.longitude,
          altitude: gps.altitude,
          accuracy: gps.accuracy,
          accuracyTier,
          mocked: gps.mocked,
          imageHash: '', // Hash will be computed in background
          isRooted: sec.isRooted,
          duplicateProof: isDuplicate,
          deviceName: sec.deviceName,
          deviceModel: sec.deviceModel,
          osVersion: sec.osVersion,
          city: gcCity,
          state: gcState,
          country: gcCountry,
        }
      });

      // Fire and forget background worker
      processUploadQueue();

    } catch (err: any) {
      console.error(err);
      Alert.alert('Capture Failed', err.message || 'An unexpected error occurred.');
    }
  };

  if (!permissionCheckComplete) {
    return (
      <View style={styles.darkContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  // Request Permissions Page
  if (!hasCameraPermission || !hasLocationPermission) {
    return (
      <View style={styles.darkContainer}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.permissionBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color="#0EA5E9" />
          </View>
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionSubtitle}>
            This application requires access to your Camera and Location services to capture reliable proof details.
          </Text>

          <View style={styles.statusRow}>
            <Ionicons
              name={hasCameraPermission ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={hasCameraPermission ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.statusText}>Camera Permission</Text>
          </View>

          <View style={styles.statusRow}>
            <Ionicons
              name={hasLocationPermission ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={hasLocationPermission ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.statusText}>Location Permission</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={triggerPermissionRequest}>
            <Text style={styles.primaryButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.darkContainer}>
        <Text style={styles.errorText}>No back camera device available.</Text>
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
            zoom={18}
            onMapCaptured={setMapBase64}
          />
        </View>
      )}

      {/* Off-screen ViewShot Composite Renderer */}
      {capturedPhotoUri && watermarkData && (
        <View style={styles.hiddenRendererViewShot}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <WatermarkOverlay
              photoUri={capturedPhotoUri}
              mapBase64={mapBase64}
              placeName={watermarkData.placeName}
              fullAddress={watermarkData.fullAddress}
              plusCode={watermarkData.plusCode}
              latitude={watermarkData.latitude}
              longitude={watermarkData.longitude}
              timestamp={watermarkData.timestamp}
              aspectRatio={watermarkData.aspectRatio}
            />
          </ViewShot>
        </View>
      )}

      {/* Camera Viewfinder */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        outputs={[photoOutput]}
        isActive={true}
      />

      {/* Top Bar Overlay */}
      <View style={styles.topBarContainer}>
        {/* Uploading Status */}
        {uploadingCount > 0 ? (
          <View style={styles.uploadingBadge}>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.uploadingText}>Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}</Text>
          </View>
        ) : <View />}

        {/* History Button */}
        <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/history' as any)}>
          <Ionicons name="images" size={24} color="#FFFFFF" />
          {uploads.length > 0 && uploadingCount === 0 && (
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{uploads.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Header (Telemetry Panel) */}
      <View style={styles.telemetryOverlay}>
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.85)', 'rgba(15, 23, 42, 0.4)']}
          style={styles.telemetryBox}
        >
          <View style={styles.telemetryItem}>
            <Ionicons name="location" size={14} color="#38BDF8" />
            <Text style={styles.telemetryValue} numberOfLines={1}>
              {location
                ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                : 'Acquiring GPS...'}
            </Text>
            <TouchableOpacity 
              onPress={fetchLocation} 
              style={styles.refreshButton}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size={12} color="#38BDF8" />
              ) : (
                <Ionicons name="refresh" size={14} color="#38BDF8" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.telemetryItem}>
            <Ionicons name="compass" size={14} color={
              location?.accuracy 
                ? (location.accuracy <= 20 ? '#34D399' : location.accuracy <= 50 ? '#FBBF24' : '#EF4444') 
                : '#94A3B8'
            } />
            <Text style={styles.telemetryValue}>
              {location?.accuracy ? `±${location.accuracy.toFixed(1)}m` : '--'}
            </Text>
            {location?.accuracy && (
              <View style={[
                styles.accuracyBadge,
                location.accuracy <= 20 ? styles.accuracyGood :
                location.accuracy <= 50 ? styles.accuracyWarn : styles.accuracyPoor
              ]}>
                <Text style={styles.accuracyBadgeText}>
                  {location.accuracy <= 20 ? 'GOOD' : location.accuracy <= 50 ? 'WARN' : 'POOR'}
                </Text>
              </View>
            )}
          </View>

          {securityData?.isRooted && (
            <View style={[styles.telemetryItem, styles.warningBadge]}>
              <Ionicons name="warning" size={12} color="#EF4444" />
              <Text style={[styles.telemetryValue, { color: '#EF4444' }]}>ROOTED</Text>
            </View>
          )}

          {location?.mocked && (
            <View style={[styles.telemetryItem, styles.warningBadge]}>
              <Ionicons name="alert-circle" size={12} color="#EF4444" />
              <Text style={[styles.telemetryValue, { color: '#EF4444' }]}>MOCKED GPS</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Camera Capture Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.shutterButton} onPress={handleCapturePipeline}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  // Hidden renderers for watermarking
  hiddenRenderer: {
    position: 'absolute',
    top: -5000,
    left: -5000,
  },
  hiddenRendererViewShot: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: 'none',
    zIndex: -1,
  },
  permissionBox: {
    width: '85%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginLeft: 12,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  // Top Bar Layout
  topBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  historyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  historyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  telemetryOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 105 : 75,
    left: 20,
    right: 20,
  },
  telemetryBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginVertical: 4,
  },
  refreshButton: {
    marginLeft: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  telemetryValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    marginLeft: 6,
  },
  warningBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accuracyBadge: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  accuracyGood: {
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
  },
  accuracyWarn: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  accuracyPoor: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  accuracyBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
  },
});
