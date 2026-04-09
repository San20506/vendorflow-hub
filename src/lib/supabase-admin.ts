/**
 * Supabase Admin SDK
 * Server-side only — uses service role key
 * NEVER expose service_role_key in client code
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase admin credentials not configured');
}

// Admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Seed demo data for testing and development
 * Idempotent: safe to call multiple times
 */
export async function seedDemoData() {
  try {
    console.log('Starting demo data seed...');

    // 1. Create demo users
    const demoUsers = [
      { email: 'admin@vendorflow.local', password: 'admin123', role: 'admin' as const },
      { email: 'vendor@vendorflow.local', password: 'vendor123', role: 'vendor' as const },
      { email: 'ops@vendorflow.local', password: 'ops123', role: 'operations' as const },
    ];

    const userIds: Record<string, string> = {};

    for (const demoUser of demoUsers) {
      // Check if user exists
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', demoUser.email)
        .single();

      if (existing) {
        userIds[demoUser.email] = existing.id;
        console.log(`User already exists: ${demoUser.email}`);
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true,
      });

      if (authError) {
        console.warn(`Failed to create auth user ${demoUser.email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.warn(`No user returned for ${demoUser.email}`);
        continue;
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email: demoUser.email,
        password_hash: '', // Managed by Supabase Auth
        role: demoUser.role,
      });

      if (profileError) {
        console.warn(`Failed to create profile for ${demoUser.email}:`, profileError.message);
        continue;
      }

      userIds[demoUser.email] = authData.user.id;
      console.log(`Created user: ${demoUser.email}`);
    }

    // 2. Create vendors (linked to vendor users)
    const vendorUser = demoUsers.find((u) => u.role === 'vendor');
    if (vendorUser && userIds[vendorUser.email]) {
      const { data: existingVendor } = await supabaseAdmin
        .from('vendors')
        .select('vendor_id')
        .eq('user_id', userIds[vendorUser.email])
        .single();

      if (!existingVendor) {
        const { error: vendorError } = await supabaseAdmin.from('vendors').insert({
          user_id: userIds[vendorUser.email],
          name: 'Demo Vendor Co.',
          commission_rate: 5.0,
        });

        if (vendorError) {
          console.warn('Failed to create vendor:', vendorError.message);
        } else {
          console.log('Created vendor: Demo Vendor Co.');
        }
      }
    }

    // 3. Create products
    const { data: vendorData } = await supabaseAdmin
      .from('vendors')
      .select('vendor_id')
      .limit(1)
      .single();

    if (vendorData) {
      const productSkus = [
        'SKU-001',
        'SKU-002',
        'SKU-003',
        'SKU-004',
        'SKU-005',
        'SKU-006',
        'SKU-007',
        'SKU-008',
        'SKU-009',
        'SKU-010',
      ];

      for (let i = 0; i < productSkus.length; i++) {
        const { data: existingProduct } = await supabaseAdmin
          .from('products')
          .select('product_id')
          .eq('sku', productSkus[i])
          .single();

        if (!existingProduct) {
          const { error: productError } = await supabaseAdmin.from('products').insert({
            vendor_id: vendorData.vendor_id,
            sku: productSkus[i],
            name: `Demo Product ${i + 1}`,
            price: 100.0 + i * 10,
            stock: 50 + i * 5,
          });

          if (productError) {
            console.warn(`Failed to create product ${productSkus[i]}:`, productError.message);
          }
        }
      }
      console.log('Created 10 products');
    }

    // 4. Create orders
    const { data: allProducts } = await supabaseAdmin
      .from('products')
      .select('product_id')
      .limit(50);

    if (allProducts && allProducts.length > 0) {
      const orderStatuses: Array<'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'> = [
        'pending',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
      ];

      for (let i = 0; i < 50; i++) {
        const product = allProducts[i % allProducts.length];
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('order_id')
          .eq('product_id', product.product_id)
          .limit(1)
          .single();

        if (!existingOrder) {
          const status = orderStatuses[i % orderStatuses.length];
          const { error: orderError } = await supabaseAdmin.from('orders').insert({
            product_id: product.product_id,
            quantity: (i % 5) + 1,
            total_amount: (100.0 + i * 10) * ((i % 5) + 1),
            status,
          });

          if (orderError) {
            console.warn(`Failed to create order ${i}:`, orderError.message);
          }
        }
      }
      console.log('Created 50 orders');
    }

    // 5. Create returns
    const { data: allOrders } = await supabaseAdmin
      .from('orders')
      .select('order_id')
      .limit(15);

    if (allOrders && allOrders.length > 0) {
      const returnStatuses: Array<'requested' | 'approved' | 'rejected'> = [
        'requested',
        'approved',
        'rejected',
      ];
      const reasons = [
        'Damaged in transit',
        'Not as described',
        'Wrong item shipped',
        'Quality issue',
        'Changed mind',
      ];

      for (let i = 0; i < Math.min(15, allOrders.length); i++) {
        const { data: existingReturn } = await supabaseAdmin
          .from('returns')
          .select('return_id')
          .eq('order_id', allOrders[i].order_id)
          .single();

        if (!existingReturn) {
          const status = returnStatuses[i % returnStatuses.length];
          const reason = reasons[i % reasons.length];

          const { error: returnError } = await supabaseAdmin.from('returns').insert({
            order_id: allOrders[i].order_id,
            reason,
            status,
          });

          if (returnError) {
            console.warn(`Failed to create return ${i}:`, returnError.message);
          }
        }
      }
      console.log('Created 15 returns');
    }

    // 6. Create settlements
    if (vendorData) {
      for (let i = 0; i < 5; i++) {
        const { data: existingSettlement } = await supabaseAdmin
          .from('settlements')
          .select('settlement_id')
          .eq('vendor_id', vendorData.vendor_id)
          .limit(1)
          .offset(i)
          .single();

        if (!existingSettlement) {
          const status: 'pending' | 'processed' = i % 2 === 0 ? 'pending' : 'processed';
          const { error: settlementError } = await supabaseAdmin
            .from('settlements')
            .insert({
              vendor_id: vendorData.vendor_id,
              net_amount: 1000.0 + i * 500,
              status,
            });

          if (settlementError) {
            console.warn(`Failed to create settlement ${i}:`, settlementError.message);
          }
        }
      }
      console.log('Created 5 settlements');
    }

    // 7. Create expenses
    if (vendorData) {
      const categories = ['Shipping', 'Packaging', 'Marketing', 'Storage', 'Utilities'];

      for (let i = 0; i < 20; i++) {
        const { data: existingExpense } = await supabaseAdmin
          .from('expenses')
          .select('expense_id')
          .eq('vendor_id', vendorData.vendor_id)
          .limit(1)
          .offset(i)
          .single();

        if (!existingExpense) {
          const category = categories[i % categories.length];
          const { error: expenseError } = await supabaseAdmin.from('expenses').insert({
            vendor_id: vendorData.vendor_id,
            category,
            amount: 50.0 + (i % 200),
          });

          if (expenseError) {
            console.warn(`Failed to create expense ${i}:`, expenseError.message);
          }
        }
      }
      console.log('Created 20 expenses');
    }

    console.log('Demo data seed completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Demo data seed failed:', error);
    throw error;
  }
}
