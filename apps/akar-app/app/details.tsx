import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUploadStore } from '@/src/store/useUploadStore';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

export default function DetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const uploadItem = useUploadStore((state) => state.items.find(i => i.id === id));

  if (!uploadItem) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Upload not found.</Text>
        <TouchableOpacity style={styles.backBtnError} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleShareWhatsApp = async () => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not supported on this device.');
        return;
      }

      await Sharing.shareAsync(uploadItem.localUri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Share Field Proof ${uploadItem.id}`,
        UTI: 'public.jpeg',
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proof Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={{ uri: uploadItem.localUri }} 
          style={styles.fullImage}
          resizeMode="contain" 
        />
        
        <View style={styles.detailsCard}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={[styles.statusBadge, 
              uploadItem.status === 'completed' ? styles.statusSuccess :
              uploadItem.status === 'failed' ? styles.statusError : styles.statusPending
            ]}>
              <Text style={styles.statusText}>{uploadItem.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Proof ID:</Text>
            <Text style={styles.value}>{uploadItem.id}</Text>
          </View>

          {uploadItem.metadata.imageHash ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>SHA256:</Text>
              <Text style={styles.valueHash} numberOfLines={2} ellipsizeMode="middle">
                {uploadItem.metadata.imageHash}
              </Text>
            </View>
          ) : null}

          {uploadItem.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorMsg}>{uploadItem.error}</Text>
            </View>
          )}

          {uploadItem.status === 'completed' && (
            <TouchableOpacity style={styles.shareButton} onPress={handleShareWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.shareButtonText}>Share via WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  fullImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#000000',
  },
  detailsCard: {
    margin: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusPending: { backgroundColor: 'rgba(14, 165, 233, 0.2)' },
  statusError: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    marginBottom: 16,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    color: '#F8FAFC',
    fontSize: 16,
  },
  valueHash: {
    color: '#38BDF8',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  errorMsg: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#F8FAFC',
    fontSize: 18,
    marginBottom: 20,
  },
  backBtnError: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
