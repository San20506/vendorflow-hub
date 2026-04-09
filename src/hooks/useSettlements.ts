import { useQuery } from '@tanstack/react-query';
import { getSettlements } from '@/lib/queries';
import type { Database } from '@/types/database';

type Settlement = Database['public']['Tables']['settlements']['Row'];

export function useSettlements(vendorId: string | null) {
  return useQuery<Settlement[], Error>({
    queryKey: ['settlements', vendorId],
    queryFn: () => {
      if (!vendorId) throw new Error('Vendor ID required');
      return getSettlements(vendorId);
    },
    enabled: !!vendorId,
  });
}
