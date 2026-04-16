/**
 * Database query functions for Supabase
 * These functions encapsulate all database access patterns
 * Reads from platform_orders and platform_settlements (real data tables)
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

// Keep type alias for getCurrentVendor return type
type VendorRow = Database['public']['Tables']['vendors']['Row'];

/**
 * Resolve vendor_id from either a user_id (auth uid) or a vendor_id.
 * Queries the vendors table: first tries user_id, then vendor_id.
 */
export async function resolveVendorId(userId: string): Promise<string | null> {
  // Try matching user_id first
  const { data: byUser } = await supabase
    .from('vendors')
    .select('vendor_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (byUser?.vendor_id) return byUser.vendor_id;

  // Fallback: maybe userId already is the vendor_id
  const { data: byVendor } = await supabase
    .from('vendors')
    .select('vendor_id')
    .eq('vendor_id', userId)
    .maybeSingle();

  return byVendor?.vendor_id ?? null;
}

/**
 * Get all orders for a vendor from platform_orders.
 * Accepts either user_id or vendor_id — resolves internally.
 */
export async function getOrdersForVendor(userId: string): Promise<any[]> {
  const vendorId = await resolveVendorId(userId);
  if (!vendorId) return [];

  const { data, error } = await supabase
    .from('platform_orders' as any)
    .select('*')
    .eq('vendor_id', vendorId)
    .order('order_date', { ascending: false });

  if (error) {
    console.error('Error fetching platform_orders:', error);
    throw error;
  }

  // Map to the shape expected by useOrders consumers (Dashboard.tsx etc.)
  return (data || []).map((row: any) => ({
    ...row,
    // Legacy field mappings
    total_amount: row.sale_amount,
    status: (row.status || '').toLowerCase(),
    created_at: row.order_date,
    portal: row.platform,
    order_date: row.order_date,
    product_name: row.product_name,
    sku: row.sku,
    // Optional legacy fields (null ok)
    product_id: null,
    channel_id: null,
    order_number: row.platform_order_id,
    customer_name: null,
  }));
}

/**
 * Get all settlements for a vendor from platform_settlements.
 */
export async function getSettlements(userId: string): Promise<any[]> {
  const vendorId = await resolveVendorId(userId);
  if (!vendorId) return [];

  const { data, error } = await supabase
    .from('platform_settlements' as any)
    .select('*')
    .eq('vendor_id', vendorId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching platform_settlements:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    ...row,
    // Legacy field mappings
    status: (row.net_settlement ?? 0) > 0 ? 'completed' : 'pending',
    amount: row.net_settlement ?? row.sale_amount,
    portal: row.platform,
    order_id: row.platform_order_id,
    created_at: row.payment_date,
  }));
}

/**
 * Derive unique products from platform_orders (group by sku + product_name).
 */
export async function getProducts(userId: string): Promise<any[]> {
  const vendorId = await resolveVendorId(userId);
  if (!vendorId) return [];

  const { data, error } = await supabase
    .from('platform_orders' as any)
    .select('sku, product_name, quantity, sale_amount, vendor_id')
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Error fetching products from platform_orders:', error);
    throw error;
  }

  // Group by sku + product_name
  const map = new Map<string, { sku: string; product_name: string; total_qty: number; total_sale: number; count: number; vendor_id: string }>();

  for (const row of (data || []) as any[]) {
    const key = `${row.sku}__${row.product_name}`;
    const existing = map.get(key);
    const qty = Number(row.quantity) || 0;
    const sale = Number(row.sale_amount) || 0;
    if (existing) {
      existing.total_qty += qty;
      existing.total_sale += sale;
      existing.count += 1;
    } else {
      map.set(key, { sku: row.sku, product_name: row.product_name, total_qty: qty, total_sale: sale, count: 1, vendor_id: row.vendor_id });
    }
  }

  return Array.from(map.values()).map(p => ({
    product_id: p.sku,
    name: p.product_name,
    sku: p.sku,
    stock: p.total_qty,
    quantity: p.total_qty,
    price: p.count > 0 ? p.total_sale / p.count : 0,
    vendor_id: p.vendor_id,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Get vendor info for authenticated user
 */
export async function getCurrentVendor(): Promise<VendorRow | null> {
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

// Keep legacy exports so any other callers don't break
export async function getOrders(vendorId: string): Promise<any[]> {
  return getOrdersForVendor(vendorId);
}

export async function getReturns(_vendorId: string): Promise<any[]> {
  return [];
}

export async function getExpenses(_vendorId: string): Promise<any[]> {
  return [];
}
