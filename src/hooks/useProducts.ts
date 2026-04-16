import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/queries';

export function useProducts(vendorId: string | null) {
  return useQuery<any[], Error>({
    queryKey: ['products', vendorId],
    queryFn: () => {
      if (!vendorId) throw new Error('Vendor ID required');
      return getProducts(vendorId);
    },
    enabled: !!vendorId,
  });
}
