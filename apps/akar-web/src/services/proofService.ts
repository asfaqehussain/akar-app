import { supabase } from '../lib/supabase';
import { Proof } from '../types/proof';

interface SupabaseProofRow {
  proof_id: string;
  image_url: string;
  storage_path: string;
  captured_at: string;
  uploaded_at: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  hash: string;
  device_id: string;
  device_model: string;
  app_version: string;
  mock_location: boolean;
  city: string;
  state: string;
  country: string;
}

function mapRowToProof(row: SupabaseProofRow): Proof {
  const { data: publicUrlData } = supabase.storage
    .from('proofs')
    .getPublicUrl(row.storage_path);

  return {
    proofId: row.proof_id,
    imageUrl: publicUrlData.publicUrl,
    storagePath: row.storage_path,
    capturedAt: row.captured_at,
    uploadedAt: row.uploaded_at,
    latitude: Number(row.latitude) || 0,
    longitude: Number(row.longitude) || 0,
    accuracy: Number(row.accuracy) || 0,
    hash: row.hash || '',
    deviceId: row.device_id || '',
    deviceModel: row.device_model || '',
    appVersion: row.app_version || '',
    mockLocation: !!row.mock_location,
    city: row.city || '',
    state: row.state || '',
    country: row.country || '',
  };
}

export const proofService = {
  /**
   * Fetches all proofs from the Supabase 'proofs' table, sorted by capture time.
   *
   * @returns Array of typed Proof objects
   */
  async getProofs(): Promise<Proof[]> {
    try {
      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .order('captured_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(mapRowToProof);
    } catch (error: any) {
      console.error('Failed to get proofs from Supabase:', error);
      throw new Error(`Failed to fetch proofs: ${error?.message || error}`);
    }
  },

  /**
   * Fetches a specific proof by its proof_id.
   *
   * @param proofId Unique proof identifier
   * @returns The Proof object or null if not found
   */
  async getProofById(proofId: string): Promise<Proof | null> {
    try {
      if (!proofId) {
        throw new Error('Proof ID is required');
      }

      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .eq('proof_id', proofId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(error.message);
      }

      return mapRowToProof(data);
    } catch (error: any) {
      console.error(`Failed to get proof by ID (${proofId}) from Supabase:`, error);
      throw new Error(`Failed to fetch proof details: ${error?.message || error}`);
    }
  },
};
