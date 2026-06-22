import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Proof } from '../../types/proof';

export const proofService = {
  /**
   * Registers a proof metadata document in Firestore.
   * 
   * @param proofId Unique proof identifier (document key)
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

      await setDoc(doc(db, 'proofs', proofId), proof);
    } catch (error: any) {
      console.error('Firestore save proof failed:', error);
      throw new Error(`Failed to save proof metadata: ${error?.message || error}`);
    }
  }
};
