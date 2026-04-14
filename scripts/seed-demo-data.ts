import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoData() {
  console.log('Starting demo data seed...');

  try {
    // Get or create demo vendor
    let vendor = await supabase
      .from('vendors')
      .select('*')
      .eq('name', 'Demo Vendor')
      .single();

    if (vendor.error) {
      console.log('Creating demo vendor...');
      const createVendor = await supabase
        .from('vendors')
        .insert({
          name: 'Demo Vendor',
          gst_number: 'DEMO123GST',
          email: 'demo@vendorflow.com',
          status: 'active',
        })
        .select()
        .single();

      if (createVendor.error) {
        console.error('Failed to create vendor:', createVendor.error);
        return;
      }
      vendor.data = createVendor.data;
    }

    const vendorId = vendor.data?.id;
    console.log(`Using vendor ID: ${vendorId}`);

    // Insert demo products
    const demoProducts = [
      { name: 'Wireless Headphones', sku: 'WH-001', quantity: 50, price: 2999, vendor_id: vendorId },
      { name: 'USB-C Cable', sku: 'USB-001', quantity: 200, price: 499, vendor_id: vendorId },
      { name: 'Phone Stand', sku: 'PS-001', quantity: 100, price: 799, vendor_id: vendorId },
      { name: 'Screen Protector', sku: 'SP-001', quantity: 500, price: 199, vendor_id: vendorId },
      { name: 'Power Bank 20000mAh', sku: 'PB-001', quantity: 75, price: 1499, vendor_id: vendorId },
    ];

    console.log('Inserting demo products...');
    const productsRes = await supabase
      .from('products')
      .insert(demoProducts)
      .select();

    if (productsRes.error) {
      console.error('Failed to insert products:', productsRes.error);
      return;
    }

    console.log(`✅ Inserted ${productsRes.data?.length || 0} demo products`);

    // Insert demo orders
    const demoOrders = [
      {
        vendor_id: vendorId,
        order_number: 'ORD-2026-001',
        channel: 'amazon',
        status: 'delivered',
        total_amount: 5998,
        order_date: new Date('2026-04-10').toISOString(),
      },
      {
        vendor_id: vendorId,
        order_number: 'ORD-2026-002',
        channel: 'flipkart',
        status: 'processing',
        total_amount: 2999,
        order_date: new Date('2026-04-12').toISOString(),
      },
      {
        vendor_id: vendorId,
        order_number: 'ORD-2026-003',
        channel: 'meesho',
        status: 'shipped',
        total_amount: 7497,
        order_date: new Date('2026-04-13').toISOString(),
      },
    ];

    console.log('Inserting demo orders...');
    const ordersRes = await supabase
      .from('orders')
      .insert(demoOrders)
      .select();

    if (ordersRes.error) {
      console.error('Failed to insert orders:', ordersRes.error);
      return;
    }

    console.log(`✅ Inserted ${ordersRes.data?.length || 0} demo orders`);

    // Insert demo channels
    const demoChannels = [
      {
        vendor_id: vendorId,
        name: 'Amazon',
        platform: 'amazon',
        status: 'active',
        seller_id: 'DEMO-AMAZON-001',
      },
      {
        vendor_id: vendorId,
        name: 'Flipkart',
        platform: 'flipkart',
        status: 'active',
        seller_id: 'DEMO-FLIPKART-001',
      },
      {
        vendor_id: vendorId,
        name: 'Meesho',
        platform: 'meesho',
        status: 'active',
        seller_id: 'DEMO-MEESHO-001',
      },
    ];

    console.log('Inserting demo channels...');
    const channelsRes = await supabase
      .from('channels')
      .insert(demoChannels)
      .select();

    if (channelsRes.error) {
      console.error('Failed to insert channels:', channelsRes.error);
      return;
    }

    console.log(`✅ Inserted ${channelsRes.data?.length || 0} demo channels`);

    console.log('\n✅ Demo data seeding complete!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

seedDemoData();
