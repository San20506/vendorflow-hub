/**
 * Database query functions for Supabase
 * These functions encapsulate all database access patterns
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

// Type aliases for cleaner return types
type Product = Database['public']['Tables']['products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Settlement = Database['public']['Tables']['settlements']['Row'];
type Return = Database['public']['Tables']['returns']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];

/**
 * Get all products for a vendor
 */
export async function getProducts(vendorId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all orders for a vendor
 */
export async function getOrders(vendorId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      product:products(
        product_id,
        name,
        sku,
        vendor_id
      )
    `)
    .eq('products.vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all orders for a vendor (simplified, no joins for reliability)
 */
export async function getOrdersForVendor(vendorId: string): Promise<(Order & { product_name?: string })[]> {
  // Get all products for this vendor
  const { data: products } = await supabase
    .from('products')
    .select('product_id, name')
    .eq('vendor_id', vendorId);

  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products.map(p => p.product_id);

  // Get all orders for those products
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('product_id', productIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  // Enrich orders with product names
  const enrichedOrders = (data || []).map(order => {
    const product = products.find(p => p.product_id === order.product_id);
    return {
      ...order,
      product_name: product?.name,
    };
  });

  return enrichedOrders;
}

/**
 * Get all settlements for a vendor
 */
export async function getSettlements(vendorId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching settlements:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all returns for a vendor's orders
 */
export async function getReturns(vendorId: string): Promise<Return[]> {
  // Get product IDs for this vendor
  const { data: products } = await supabase
    .from('products')
    .select('product_id')
    .eq('vendor_id', vendorId);

  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products.map(p => p.product_id);

  // Get all orders for those products
  const { data: orders } = await supabase
    .from('orders')
    .select('order_id')
    .in('product_id', productIds);

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map(o => o.order_id);

  // Get all returns for those orders
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching returns:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all expenses for a vendor
 */
export async function getExpenses(vendorId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get vendor info for authenticated user
 */
export async function getCurrentVendor(): Promise<Database['public']['Tables']['vendors']['Row'] | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }

  return data;
}
