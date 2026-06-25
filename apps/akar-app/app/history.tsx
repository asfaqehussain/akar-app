import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useUploadStore } from '@/src/store/useUploadStore';
import { Ionicons } from '@expo/vector-icons';
import { formatTimestamp } from '@/src/utils/formatTimestamp';

export default function HistoryScreen() {
  const router = useRouter();
  const uploads = useUploadStore((state) => state.items);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      case 'uploading':
      case 'pending':
        return <Ionicons name="sync-circle" size={24} color="#0EA5E9" />;
      case 'failed':
        return <Ionicons name="alert-circle" size={24} color="#EF4444" />;
      default:
        return <Ionicons name="help-circle" size={24} color="#94A3B8" />;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/details', params: { id: item.id } } as any)}
    >
      <Image source={{ uri: item.localUri }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.proofId}>ID: {item.id.toUpperCase()}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(new Date(item.createdAt))}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {item.metadata.city ? `${item.metadata.city}, ` : ''}{item.metadata.country || ''}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        {getStatusIcon(item.status)}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload History</Text>
        <View style={{ width: 24 }} />
      </View>

      {uploads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#334155" />
          <Text style={styles.emptyText}>No captured images yet.</Text>
        </View>
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  proofId: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
  },
  location: {
    color: '#64748B',
    fontSize: 12,
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 16,
  },
});
