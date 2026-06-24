import { supabase } from '../supabase/supabaseClient';

export const uploadService = {
  /**
   * Uploads the watermarked image to Supabase Storage.
   * 
   * @param imageUri Local path of the marked image
   * @param proofId Unique proof identifier
   * @returns Public URL and storage path
   */
  async uploadProof(imageUri: string, proofId: string): Promise<{ imageUrl: string; storagePath: string }> {
    try {
      if (!imageUri) {
        throw new Error('Image URI is required for upload');
      }
      if (!proofId) {
        throw new Error('Proof ID is required for upload');
      }

      // Ensure the URI has a file:// scheme for fetch()
      const normalizedUri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;

      // Read the file as ArrayBuffer (more reliable than Blob in React Native)
      const response = await fetch(normalizedUri);
      const arrayBuffer = await response.arrayBuffer();

      const storagePath = `proofs/${proofId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('proofs')
        .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;

      return { imageUrl, storagePath };
    } catch (error: any) {
      console.error('Supabase Storage upload failed:', error);
      throw new Error(`Upload failed: ${error?.message || error}`);
    }
  }
};
