import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/queries';
import type { Database } from '@/types/database';

type Product = Database['public']['Tables']['products']['Row'];

export function useProducts(vendorId: string | null) {
  return useQuery<Product[], Error>({
    queryKey: ['products', vendorId],
    queryFn: () => {
      if (!vendorId) throw new Error('Vendor ID required');
      return getProducts(vendorId);
    },
    enabled: !!vendorId,
  });
}
