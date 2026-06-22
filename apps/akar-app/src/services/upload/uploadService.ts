import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firestore/firebase';

export const uploadService = {
  /**
   * Uploads the watermarked image to Firebase Storage.
   * 
   * @param imageUri Local path of the marked image
   * @param proofId Unique proof identifier
   * @returns Reference URL and key
   */
  async uploadProof(imageUri: string, proofId: string): Promise<{ imageUrl: string; r2Key: string }> {
    try {
      if (!imageUri) {
        throw new Error('Image URI is required for upload');
      }
      if (!proofId) {
        throw new Error('Proof ID is required for upload');
      }

      // Fetch the local file URI to get a Blob for Firebase SDK upload
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const r2Key = `proofs/${proofId}.jpg`;
      const storageRef = ref(storage, r2Key);

      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      return { imageUrl, r2Key };
    } catch (error: any) {
      console.error('Firebase Storage upload failed:', error);
      throw new Error(`Upload failed: ${error?.message || error}`);
    }
  }
};
