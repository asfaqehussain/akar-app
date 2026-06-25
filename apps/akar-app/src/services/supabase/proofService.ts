import { supabase } from './supabaseClient';
import { Proof } from '../../types/proof';

export const proofService = {
  /**
   * Inserts proof metadata into the Supabase 'proofs' table.
   * 
   * @param proofId Unique proof identifier
   * @param proof Proof metadata details
   */
  async saveProof(proofId: string, proof: Proof): Promise<void> {
    try {
      if (!proofId) {
        throw new Error('Proof ID is required to save metadata');
      }
      if (!proof) {
        throw new Error('Proof metadata is required to save');
      }

      const { error } = await supabase
        .from('proofs')
        .insert({
          proof_id: proof.proofId,
          image_url: proof.imageUrl,
          storage_path: proof.storagePath,
          captured_at: proof.capturedAt,
          uploaded_at: proof.uploadedAt,
          latitude: proof.latitude,
          longitude: proof.longitude,
          accuracy: proof.accuracy,
          accuracy_tier: proof.accuracyTier || 'good',
          hash: proof.hash,
          device_id: proof.deviceId,
          device_model: proof.deviceModel,
          app_version: proof.appVersion,
          mock_location: proof.mockLocation,
          is_rooted: proof.isRooted || false,
          duplicate_proof: proof.duplicateProof || false,
          city: proof.city,
          state: proof.state,
          country: proof.country,
        });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Supabase save proof failed:', error);
      throw new Error(`Failed to save proof metadata: ${error?.message || error}`);
    }
  }
};
