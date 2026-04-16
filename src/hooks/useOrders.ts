import { useQuery } from '@tanstack/react-query';
import { getOrdersForVendor } from '@/lib/queries';

export function useOrders(vendorId: string | null) {
  return useQuery<any[], Error>({
    queryKey: ['orders', vendorId],
    queryFn: () => {
      if (!vendorId) throw new Error('Vendor ID required');
      return getOrdersForVendor(vendorId);
    },
    enabled: !!vendorId,
  });
}
