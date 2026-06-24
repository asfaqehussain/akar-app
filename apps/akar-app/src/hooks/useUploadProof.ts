import { useState } from 'react';
import { File } from 'expo-file-system/next';
import DeviceInfo from 'react-native-device-info';
import { uploadService } from '../services/upload/uploadService';
import { proofService } from '../services/supabase/proofService';
import { shareService } from '../services/share/shareService';
import { Proof } from '../types/proof';

export interface UploadProofParams {
  imagePath: string;
  proofId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
  hash: string;
}

export const useUploadProof = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Runs the complete upload & sharing pipeline.
   * 
   * @param params Upload input parameters
   * @returns Success boolean status
   */
  const uploadProof = async (params: UploadProofParams): Promise<boolean> => {
    setIsUploading(true);
    setError(null);
    try {
      // 1. Upload watermarked image to Supabase Storage
      setProgress('Uploading...');
      const { imageUrl, storagePath } = await uploadService.uploadProof(params.imagePath, params.proofId);

      // 2. Register metadata in Supabase
      setProgress('Saving metadata...');
      const deviceId = await DeviceInfo.getUniqueId();
      const brand = DeviceInfo.getBrand();
      const model = DeviceInfo.getModel();
      const appVersion = DeviceInfo.getVersion();
      const isEmulator = await DeviceInfo.isEmulator();

      const proofDoc: Proof = {
        proofId: params.proofId,
        imageUrl,
        storagePath,
        capturedAt: params.capturedAt,
        uploadedAt: new Date().toISOString(),
        latitude: params.latitude,
        longitude: params.longitude,
        accuracy: params.accuracy,
        hash: params.hash,
        deviceId,
        deviceModel: `${brand} ${model}`,
        appVersion,
        mockLocation: isEmulator, // Treat emulator run as mock/demo location status
      };

      await proofService.saveProof(params.proofId, proofDoc);

      // 3. Share image via WhatsApp
      setProgress('Opening WhatsApp...');
      const message = `Proof ID: ${params.proofId}\n\nCaptured At:\n${params.capturedAt}\n\nLocation:\n${params.latitude},${params.longitude}`;
      await shareService.shareToWhatsApp(params.imagePath, message);

      // 4. Delete the temporary file using new expo-file-system API
      try {
        const tempFile = new File(params.imagePath);
        if (tempFile.exists) {
          tempFile.delete();
        }
      } catch (fileError) {
        console.warn('Failed to delete temporary local file:', fileError);
      }

      setProgress('Proof shared successfully');
      setIsUploading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred during proof registration.';
      setError(errorMessage);
      setIsUploading(false);
      // Propagate error (do not swallow)
      throw err;
    }
  };

  return {
    isUploading,
    progress,
    error,
    uploadProof,
  };
};
