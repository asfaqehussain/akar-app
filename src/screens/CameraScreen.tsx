import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput, CameraRef } from 'react-native-vision-camera';
import { useIsFocused, useNavigation, NavigationProp } from '@react-navigation/native';
import ImageMarker, { Position, TextBackgroundType, ImageFormat } from 'react-native-image-marker';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { formatTimestamp } from '../utils/formatTimestamp';
import { generateWatermarkText } from '../utils/generateWatermarkText';
import { RootStackParamList } from '../navigation/RootNavigator';

export default function CameraScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { location, loading: locationLoading, errorMsg: locationError, refetchLocation } = useCurrentLocation();
  const photoOutput = usePhotoOutput();

  const [isCapturing, setIsCapturing] = useState(false);

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

      // 2. Generate current timestamp
      const timestampText = formatTimestamp(new Date());

      // 3. Build watermark text
      const watermarkText = generateWatermarkText(
        timestampText,
        location.latitude,
        location.longitude,
        location.accuracy
      );

      // 4. Use react-native-image-marker to write the watermark permanently
      const markedImagePath = await ImageMarker.markText({
        backgroundImage: {
          src: rawPhotoUri,
          scale: 1.0,
        },
        watermarkTexts: [
          {
            text: watermarkText,
            position: {
              position: Position.bottomRight,
            },
            style: {
              color: '#FFFFFF',
              fontSize: 34,
              fontName: 'Arial',
              bold: true,
              shadowStyle: {
                dx: 2,
                dy: 2,
                radius: 3,
                color: '#000000',
              },
              textBackgroundStyle: {
                type: TextBackgroundType.none,
                color: '#00000080', // 50% opaque black
                paddingX: 16,
                paddingY: 16,
              },
            },
          },
        ],
        quality: 95,
        saveFormat: ImageFormat.jpg,
      });

      setIsCapturing(false);

      // 5. Navigate to Preview screen
      navigation.navigate('Preview', {
        photo: {
          uri: markedImagePath,
          timestamp: timestampText.replace('\n', ', '),
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
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

  // 2. Camera Viewfinder Screen
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        device={device}
        outputs={[photoOutput]}
        isActive={isFocused}
      />

      {/* Floating HUD - GPS telemetry */}
      <SafeAreaView style={styles.hudContainer}>
        <View style={styles.hudCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, location ? styles.dotReady : styles.dotWaiting]} />
            <Text style={styles.statusLabel}>
              {location ? 'GPS Ready' : locationLoading ? 'Acquiring GPS Fix...' : 'GPS Offline'}
            </Text>
          </View>
          {location ? (
            <View style={styles.gpsDetails}>
              <Text style={styles.gpsText}>Lat: {location.latitude.toFixed(6)}</Text>
              <Text style={styles.gpsText}>Lng: {location.longitude.toFixed(6)}</Text>
              <Text style={styles.gpsText}>Accuracy: {Math.round(location.accuracy)}m</Text>
            </View>
          ) : (
            <View style={styles.gpsOfflineContainer}>
              <Text style={styles.gpsOfflineText}>
                {locationError ? `Error: ${locationError}` : 'Waiting for GPS location data...'}
              </Text>
              <TouchableOpacity style={styles.retryGpsButton} onPress={refetchLocation}>
                <Text style={styles.retryGpsText}>Force Refresh GPS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

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
  hudContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 30,
    left: 16,
    right: 16,
  },
  hudCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dotReady: {
    backgroundColor: '#10B981',
  },
  dotWaiting: {
    backgroundColor: '#FBBF24',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  gpsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gpsText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  gpsOfflineContainer: {
    alignItems: 'flex-start',
  },
  gpsOfflineText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  retryGpsButton: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryGpsText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  shutterInnerDisabled: {
    backgroundColor: '#64748B',
  },
});
