import { useQuery } from '@tanstack/react-query';
import { getOrdersForVendor } from '@/lib/queries';
import type { Database } from '@/types/database';

type Order = Database['public']['Tables']['orders']['Row'];

export function useOrders(vendorId: string | null) {
  return useQuery<(Order & { product_name?: string })[], Error>({
    queryKey: ['orders', vendorId],
    queryFn: () => {
      if (!vendorId) throw new Error('Vendor ID required');
      return getOrdersForVendor(vendorId);
    },
    enabled: !!vendorId,
  });
}
