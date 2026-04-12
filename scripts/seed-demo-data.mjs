#!/usr/bin/env node

/**
 * Seed demo data into Supabase
 * Usage: node scripts/seed-demo-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials:');
  console.error('  - VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('  - VITE_SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data seed...\n');

    // 1. Create demo users
    const demoUsers = [
      { email: 'admin@vendorflow.local', password: 'admin123', role: 'admin' },
      { email: 'vendor@vendorflow.local', password: 'vendor123', role: 'vendor' },
      { email: 'ops@vendorflow.local', password: 'ops123', role: 'operations' },
    ];

    const userIds = {};

    for (const demoUser of demoUsers) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', demoUser.email)
        .single();

      if (existing) {
        userIds[demoUser.email] = existing.id;
        console.log(`✓ User already exists: ${demoUser.email}`);
        continue;
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true,
      });

      if (authError) {
        console.warn(`✗ Failed to create auth user ${demoUser.email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.warn(`✗ No user returned for ${demoUser.email}`);
        continue;
      }

      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email: demoUser.email,
        password_hash: '',
        role: demoUser.role,
      });

      if (profileError) {
        console.warn(`✗ Failed to create profile for ${demoUser.email}:`, profileError.message);
        continue;
      }

      userIds[demoUser.email] = authData.user.id;
      console.log(`✓ Created user: ${demoUser.email}`);
    }

    // 2. Create vendor
    const vendorUser = demoUsers.find((u) => u.role === 'vendor');
    let vendorData = null;

    if (vendorUser && userIds[vendorUser.email]) {
      const { data: existingVendor } = await supabaseAdmin
        .from('vendors')
        .select('vendor_id')
        .eq('user_id', userIds[vendorUser.email])
        .single();

      if (!existingVendor) {
        const { data: newVendor, error: vendorError } = await supabaseAdmin
          .from('vendors')
          .insert({
            user_id: userIds[vendorUser.email],
            name: 'Demo Vendor Co.',
            commission_rate: 5.0,
          })
          .select()
          .single();

        if (vendorError) {
          console.warn('✗ Failed to create vendor:', vendorError.message);
        } else {
          vendorData = newVendor;
          console.log('✓ Created vendor: Demo Vendor Co.');
        }
      } else {
        vendorData = existingVendor;
        console.log('✓ Vendor already exists');
      }
    }

    if (!vendorData) {
      const { data } = await supabaseAdmin.from('vendors').select('vendor_id').limit(1).single();
      vendorData = data;
    }

    // 3. Create products
    if (vendorData) {
      const productSkus = Array.from({ length: 10 }, (_, i) => `SKU-${String(i + 1).padStart(3, '0')}`);

      for (const sku of productSkus) {
        const { data: existingProduct } = await supabaseAdmin
          .from('products')
          .select('product_id')
          .eq('sku', sku)
          .single();

        if (!existingProduct) {
          const { error: productError } = await supabaseAdmin.from('products').insert({
            vendor_id: vendorData.vendor_id,
            sku,
            name: `Demo Product ${sku}`,
            price: 100.0 + Math.random() * 500,
            stock: 50 + Math.floor(Math.random() * 100),
          });

          if (productError) {
            console.warn(`✗ Failed to create product ${sku}:`, productError.message);
          }
        }
      }
      console.log('✓ Created/verified 10 products');
    }

    // 4. Create orders
    if (vendorData) {
      const { data: allProducts } = await supabaseAdmin.from('products').select('product_id').limit(50);

      if (allProducts && allProducts.length > 0) {
        const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

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

            if (orderError && !orderError.message.includes('duplicate')) {
              console.warn(`✗ Failed to create order ${i}:`, orderError.message);
            }
          }
        }
        console.log('✓ Created/verified 50 orders');
      }
    }

    // 5. Create alert sensitivity settings
    if (vendorData) {
      const { data: existingSensitivity } = await supabaseAdmin
        .from('alert_sensitivity_settings')
        .select('vendor_id')
        .eq('vendor_id', vendorData.vendor_id)
        .single();

      if (!existingSensitivity) {
        const { error: sensitivityError } = await supabaseAdmin.from('alert_sensitivity_settings').insert({
          vendor_id: vendorData.vendor_id,
          revenue_drop_sensitivity: 6,
          stockout_risk_sensitivity: 5,
          trend_reversal_sensitivity: 6,
          channel_shift_sensitivity: 5,
          cost_anomaly_sensitivity: 7,
        });

        if (sensitivityError) {
          console.warn('✗ Failed to create alert sensitivity settings:', sensitivityError.message);
        } else {
          console.log('✓ Created alert sensitivity settings');
        }
      }
    }

    // 6. Create demo alerts
    if (vendorData) {
      const alertTypes = ['revenue_drop', 'stockout_risk', 'trend_reversal', 'channel_shift', 'cost_anomaly'];
      const channels = ['Amazon', 'Shopify', 'eBay', 'WooCommerce'];

      for (let i = 0; i < 50; i++) {
        const { error: alertError } = await supabaseAdmin.from('alert_history').insert({
          vendor_id: vendorData.vendor_id,
          alert_type: alertTypes[i % alertTypes.length],
          severity: (i % 10) + 1,
          message: `Demo alert ${i + 1}: ${alertTypes[i % alertTypes.length]} on ${channels[i % channels.length]}`,
          metadata: {
            change_pct: Math.random() * 50,
            confidence: Math.random() * 100,
            channel: channels[i % channels.length],
          },
          dismissed_at: i % 3 === 0 ? new Date().toISOString() : null,
          dismissed_by: i % 3 === 0 ? vendorData.vendor_id : null,
          dismissal_reason: i % 3 === 0 ? ['false_positive', 'already_addressed', 'low_priority'][i % 3] : null,
        });

        if (alertError && !alertError.message.includes('duplicate')) {
          console.warn(`✗ Failed to create alert ${i}:`, alertError.message);
        }
      }
      console.log('✓ Created 50 demo alerts with dismissal history');
    }

    // 7. Create marketing campaigns
    if (vendorData) {
      const campaignTypes = ['email', 'sms', 'in_app'];
      const campaignStatuses = ['draft', 'scheduled', 'sent', 'paused'];

      for (let i = 0; i < 10; i++) {
        const { error: campaignError } = await supabaseAdmin.from('campaigns').insert({
          vendor_id: vendorData.vendor_id,
          name: `Demo Campaign ${i + 1}`,
          type: campaignTypes[i % campaignTypes.length],
          status: campaignStatuses[i % campaignStatuses.length],
          segment_config: {
            filters: {
              min_order_value: 100 + i * 50,
              country: 'US',
            },
          },
        });

        if (campaignError && !campaignError.message.includes('duplicate')) {
          console.warn(`✗ Failed to create campaign ${i}:`, campaignError.message);
        }
      }
      console.log('✓ Created 10 demo marketing campaigns');
    }

    console.log('\n✅ Demo data seed completed successfully!');
    console.log('\n📊 Demo credentials:');
    demoUsers.forEach((u) => {
      console.log(`  - ${u.email} / ${u.password} (${u.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Demo data seed failed:', error);
    process.exit(1);
  }
}

seedDemoData();
