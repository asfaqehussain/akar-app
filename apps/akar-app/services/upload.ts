import { Platform } from 'react-native';

// Default endpoint configuration (can be updated with your deployed worker URL)
export const DEFAULT_BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787';

export interface ProofMetadata {
  proofId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  accuracyTier: 'good' | 'warning' | 'poor';
  mocked: boolean;
  imageHash: string;
  isRooted: boolean;
  duplicateProof: boolean;
  deviceName: string;
  deviceModel: string;
  osVersion: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Uploads the proof image and metadata to the Cloudflare Worker backend.
 * 
 * @param imageUri File path of the watermarked image (with file:// scheme)
 * @param metadata Metadata details
 * @param backendUrl Custom backend URL (optional)
 * @returns The response JSON from the worker
 */
export async function uploadProof(
  imageUri: string,
  metadata: ProofMetadata,
  backendUrl: string = DEFAULT_BACKEND_URL
) {
  const uploadUrl = `${backendUrl}/api/upload`;

  const formData = new FormData();
  
  // React Native file attachment syntax
  formData.append('image', {
    uri: imageUri,
    name: `${metadata.proofId}.jpg`,
    type: 'image/jpeg',
  } as any);

  formData.append('metadata', JSON.stringify(metadata));

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Network upload error:', error);
    throw error;
  }
}
