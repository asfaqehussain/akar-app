import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Proof } from '../types/proof';

export const proofService = {
  /**
   * Fetches all proofs from the Firestore 'proofs' collection, sorted by capture time.
   * Handles fallback key matching for maximum compatibility.
   * 
   * @returns Array of typed Proof objects
   */
  async getProofs(): Promise<Proof[]> {
    try {
      const proofsCol = collection(db, 'proofs');
      const q = query(proofsCol, orderBy('capturedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const proofs: Proof[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        proofs.push({
          proofId: docSnap.id,
          imageUrl: data.imageUrl || '',
          // Support both storagePath and mobile app's r2Key schema field
          storagePath: data.storagePath || data.r2Key || '',
          capturedAt: data.capturedAt || '',
          uploadedAt: data.uploadedAt || '',
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
          accuracy: Number(data.accuracy) || 0,
          hash: data.hash || '',
          deviceId: data.deviceId || '',
          deviceModel: data.deviceModel || '',
          appVersion: data.appVersion || '',
          mockLocation: !!data.mockLocation,
        });
      });
      
      return proofs;
    } catch (error: any) {
      console.error('Failed to get proofs from Firestore:', error);
      throw new Error(`Failed to fetch proofs: ${error?.message || error}`);
    }
  },

  /**
   * Fetches a specific proof document by its document ID.
   * 
   * @param proofId Unique proof document identifier
   * @returns The Proof object or null if not found
   */
  async getProofById(proofId: string): Promise<Proof | null> {
    try {
      if (!proofId) {
        throw new Error('Proof ID is required');
      }
      
      const docRef = doc(db, 'proofs', proofId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        proofId: docSnap.id,
        imageUrl: data.imageUrl || '',
        storagePath: data.storagePath || data.r2Key || '',
        capturedAt: data.capturedAt || '',
        uploadedAt: data.uploadedAt || '',
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        accuracy: Number(data.accuracy) || 0,
        hash: data.hash || '',
        deviceId: data.deviceId || '',
        deviceModel: data.deviceModel || '',
        appVersion: data.appVersion || '',
        mockLocation: !!data.mockLocation,
      };
    } catch (error: any) {
      console.error(`Failed to get proof by ID (${proofId}) from Firestore:`, error);
      throw new Error(`Failed to fetch proof details: ${error?.message || error}`);
    }
  }
};
