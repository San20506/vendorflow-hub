import { useQuery } from '@tanstack/react-query';
import { getSettlements } from '@/lib/queries';

export function useSettlements(vendorId: string | null) {
  return useQuery<any[], Error>({
    queryKey: ['settlements', vendorId],
    queryFn: () => {
      if (!vendorId) throw new Error('Vendor ID required');
      return getSettlements(vendorId);
    },
    enabled: !!vendorId,
  });
}
