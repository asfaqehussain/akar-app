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
import { burnWatermark } from '@/utils/watermark';
import { checkDeviceSecurity, computeSHA256, arrayBufferToHex } from '@/utils/security';
import { uploadProof, DEFAULT_BACKEND_URL } from '@/services/upload';
import { loadImage } from 'react-native-nitro-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  const [permissionCheckComplete, setPermissionCheckComplete] = useState<boolean>(false);
  
  // Pipeline/Upload status
  const [pipelineStep, setPipelineStep] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedProof, setCompletedProof] = useState<{
    proofId: string;
    path: string;
    hash: string;
  } | null>(null);

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

    setIsProcessing(true);
    setCompletedProof(null);

    try {
      // Step 1: Capture Location
      setPipelineStep('Acquiring high-accuracy GPS fix...');
      const gps = await fetchLocation();
      if (!gps) {
        throw new Error('Failed to acquire location. Ensure location services are enabled.');
      }

      if (gps.accuracy && gps.accuracy > 30) {
        // High uncertainty warning, but proceed
        console.warn('Low GPS accuracy:', gps.accuracy);
      }

      // Step 2: Capture Photo
      setPipelineStep('Capturing raw photo...');
      const photoFile = await photoOutput.capturePhotoToFile({
        flashMode: 'off',
      }, {});

      // Generate a Unique Proof ID
      const proofId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      // Step 3: Burn Watermark
      setPipelineStep('Embedding encrypted watermark...');
      const watermarkedPath = await burnWatermark(photoFile.filePath, {
        proofId,
        timestamp,
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        isMocked: gps.mocked,
      });

      // Step 4: Nitro Compression & Resizing
      setPipelineStep('Compressing & optimizing proof image...');
      const nitroImage = await loadImage({ filePath: watermarkedPath });
      
      // Resize to standard Full HD for lightweight web viewing while preserving clarity
      const resizedImage = await nitroImage.resizeAsync(1920, 1440);
      
      // Save locally to a temporary file
      const finalLocalPath = await resizedImage.saveToTemporaryFileAsync('jpg', 80);

      // Step 5: Secure SHA256 Hashing
      setPipelineStep('Generating cryptographic checksum...');
      // Get array buffer of final compressed file
      const encodedData = await resizedImage.toEncodedImageDataAsync('jpg', 80);
      const fileHash = await computeSHA256(encodedData.buffer);

      // Step 6: Server Upload
      setPipelineStep('Uploading proof to Cloudflare R2...');
      const sec = securityData || {
        isRooted: false,
        deviceName: 'Unknown',
        deviceModel: 'Unknown Device',
        osVersion: 'Unknown',
      };

      await uploadProof(
        `file://${finalLocalPath}`,
        {
          proofId,
          timestamp,
          latitude: gps.latitude,
          longitude: gps.longitude,
          altitude: gps.altitude,
          accuracy: gps.accuracy,
          mocked: gps.mocked,
          imageHash: fileHash,
          isRooted: sec.isRooted,
          deviceName: sec.deviceName,
          deviceModel: sec.deviceModel,
          osVersion: sec.osVersion,
        },
        backendUrl
      );

      setCompletedProof({
        proofId,
        path: `file://${finalLocalPath}`,
        hash: fileHash,
      });
      setPipelineStep('Success! Proof registered successfully.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Capture Pipeline Failed', err.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!completedProof) return;

    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not supported on this device.');
        return;
      }

      await Sharing.shareAsync(completedProof.path, {
        mimeType: 'image/jpeg',
        dialogTitle: `Share Field Proof ${completedProof.proofId}`,
        UTI: 'public.jpeg',
      });
    } catch (error) {
      console.error('Sharing failed:', error);
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
      {/* Camera Viewfinder */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        outputs={[photoOutput]}
        isActive={!isProcessing && !completedProof}
      />

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
          </View>

          <View style={styles.telemetryItem}>
            <Ionicons name="compass" size={14} color={location?.accuracy && location.accuracy < 20 ? '#34D399' : '#FBBF24'} />
            <Text style={styles.telemetryValue}>
              {location?.accuracy ? `±${location.accuracy.toFixed(1)}m` : '--'}
            </Text>
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

      {/* Processing Status Modal */}
      <Modal transparent visible={isProcessing} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.processingCard}>
            {completedProof ? (
              <>
                <View style={[styles.statusIconCircle, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="checkmark" size={38} color="#FFFFFF" />
                </View>
                <Text style={styles.processingTitle}>Upload Complete!</Text>
                <Text style={styles.processingSubtitle}>
                  Proof ID: {completedProof.proofId}
                </Text>
                
                <View style={styles.hashContainer}>
                  <Text style={styles.hashLabel}>SHA256 Checksum:</Text>
                  <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                    {completedProof.hash}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: '#25D366', marginTop: 20 }]}
                  onPress={handleShareWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Share to WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setIsProcessing(false)}
                >
                  <Text style={styles.secondaryButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="#0EA5E9" style={{ marginBottom: 20 }} />
                <Text style={styles.processingTitle}>Registering Proof</Text>
                <Text style={styles.processingStepText}>{pipelineStep}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  telemetryOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  processingCard: {
    width: '85%',
    padding: 28,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  processingStepText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
    textAlign: 'center',
  },
  hashContainer: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  hashLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  hashValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
  },
});
