import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useUploadProof } from '../../hooks/useUploadProof';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export default function PreviewScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<PreviewScreenRouteProp>();
  
  const {
    imagePath,
    proofId,
    latitude,
    longitude,
    accuracy,
    capturedAt,
    hash,
  } = route.params;

  const { isUploading, progress, uploadProof } = useUploadProof();

  const handleUpload = async () => {
    try {
      const success = await uploadProof({
        imagePath,
        proofId,
        latitude,
        longitude,
        accuracy,
        capturedAt,
        hash,
      });

      if (success) {
        Alert.alert(
          'Success',
          'Proof shared successfully',
          [{ text: 'OK', onPress: () => navigation.navigate('Camera') }]
        );
      }
    } catch (error: any) {
      console.error('Upload sequence failed:', error);
      Alert.alert(
        'Upload Failed',
        error?.message || 'Failed to register and share proof verification.'
      );
    }
  };

  const imageUri = imagePath.startsWith('file://')
    ? imagePath
    : imagePath.startsWith('file:/')
      ? imagePath.replace('file:/', 'file:///')
      : `file://${imagePath}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Header Panel */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Proof Details</Text>
          <Text style={styles.headerSubtitle}>Verify location metadata before registering</Text>
        </View>

        {/* Image Frame */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>

        {/* Telemetry metadata section */}
        <View style={styles.telemetryCard}>
          <Text style={styles.cardTitle}>Telemetry Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Proof ID</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
              {proofId}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Coordinates</Text>
            <Text style={styles.value}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>GPS Accuracy</Text>
            <Text style={styles.value}>±{Math.round(accuracy)} meters</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Captured At</Text>
            <Text style={styles.value}>
              {new Date(capturedAt).toLocaleString()}
            </Text>
          </View>

          <View style={styles.rowBordered}>
            <Text style={styles.label}>SHA-256 Checksum</Text>
            <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
              {hash}
            </Text>
          </View>
        </View>

        {/* Navigation Action controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={isUploading}
          >
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            activeOpacity={0.8}
            disabled={isUploading}
          >
            <Text style={styles.uploadText}>Upload Proof</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full-screen Loading Overlay with Progress status */}
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0EA5E9" style={styles.indicator} />
            <Text style={styles.loadingTitle}>Processing Proof</Text>
            <Text style={styles.loadingProgress}>{progress}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16', // Sleek dark slate
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  imageContainer: {
    height: 320,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  telemetryCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 10,
  },
  cardTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F2937',
  },
  rowBordered: {
    flexDirection: 'column',
    paddingVertical: 12,
    gap: 4,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '65%',
  },
  hashValue: {
    color: '#A855F7', // Indigo accent color for hashing digest
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 15,
    justifyContent: 'space-between',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0EA5E9', // Custom vibrant blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 30,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  indicator: {
    marginBottom: 16,
  },
  loadingTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  loadingProgress: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '600',
  },
});
