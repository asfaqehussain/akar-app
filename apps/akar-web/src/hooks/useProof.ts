import { useQuery } from '@tanstack/react-query';
import { proofService } from '../services/proofService';
import { Proof } from '../types/proof';

/**
 * React Query hook to fetch and cache a single proof document's details by ID.
 * 
 * @param proofId Unique proof document identifier
 */
export function useProof(proofId: string) {
  return useQuery<Proof | null, Error>({
    queryKey: ['proof', proofId],
    queryFn: () => proofService.getProofById(proofId),
    enabled: !!proofId, // Only execute query if proofId is provided
  });
}
