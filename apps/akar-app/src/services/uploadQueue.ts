import { useUploadStore } from '../store/useUploadStore';
import { uploadService } from './upload/uploadService';
import { supabase } from './supabase/supabaseClient';
import { computeSHA256 } from '../../utils/security';
import { loadImage } from 'react-native-nitro-image';

let isProcessingQueue = false;

export const processUploadQueue = async () => {
  if (isProcessingQueue) return;

  const store = useUploadStore.getState();
  const pendingItem = store.items.find(item => item.status === 'pending');

  if (!pendingItem) return;

  isProcessingQueue = true;
  store.updateStatus(pendingItem.id, 'uploading');

  try {
    // 1. Compress and resize
    const nitroImage = await loadImage({ filePath: pendingItem.localUri });
    const resizedImage = await nitroImage.resizeAsync(1920, 1440);
    const finalLocalPath = await resizedImage.saveToTemporaryFileAsync('jpg', 80);

    // 2. Hash
    const encodedData = await resizedImage.toEncodedImageDataAsync('jpg', 80);
    const fileHash = await computeSHA256(encodedData.buffer);

    // 3. Upload to Supabase Storage
    const response = await uploadService.uploadProof(
      `file://${finalLocalPath}`,
      pendingItem.id
    );

    // 4. Insert metadata into Supabase Database
    const { error: dbError } = await supabase.from('proofs').insert({
      proof_id: pendingItem.metadata.proofId,
      image_url: response.imageUrl,
      storage_path: response.storagePath,
      captured_at: pendingItem.metadata.timestamp,
      uploaded_at: new Date().toISOString(),
      latitude: pendingItem.metadata.latitude,
      longitude: pendingItem.metadata.longitude,
      accuracy: pendingItem.metadata.accuracy || 0,
      hash: fileHash,
      device_id: 'unknown-device-id', // Not tracked in the old metadata
      device_model: pendingItem.metadata.deviceModel,
      app_version: '1.0.0', // Not tracked in the old metadata
      mock_location: pendingItem.metadata.mocked,
      city: pendingItem.metadata.city,
      state: pendingItem.metadata.state,
      country: pendingItem.metadata.country,
    });

    if (dbError) {
      console.warn('Metadata insert failed (non-fatal if table is missing):', dbError);
    }

    store.updateStatus(pendingItem.id, 'completed', { serverUrl: response?.imageUrl });
  } catch (error: any) {
    console.error('Background upload failed for', pendingItem.id, error);
    store.updateStatus(pendingItem.id, 'failed', { error: error.message || 'Upload failed' });
  } finally {
    isProcessingQueue = false;
    // Check if there are more items to process
    processUploadQueue();
  }
};
