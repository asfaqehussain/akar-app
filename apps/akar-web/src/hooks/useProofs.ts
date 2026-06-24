import { useQuery } from '@tanstack/react-query';
import { proofService } from '../services/proofService';
import { Proof } from '../types/proof';

/**
 * React Query hook to fetch and cache the list of all proofs from Supabase.
 */
export function useProofs() {
  return useQuery<Proof[], Error>({
    queryKey: ['proofs'],
    queryFn: () => proofService.getProofs(),
  });
}
