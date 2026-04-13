import { supabase } from '@/integrations/supabase/client';

export async function seedDemoBrandData(vendorId: string) {
  const demoBrands = [
    {
      name: 'Premium Electronics',
      about: 'High-quality electronics and gadgets for modern lifestyle',
      status: 'active',
      logo_url: null,
    },
    {
      name: 'Smart Home Solutions',
      about: 'IoT devices and smart home automation products',
      status: 'active',
      logo_url: null,
    },
    {
      name: 'Tech Accessories Pro',
      about: 'Professional tech accessories and peripherals',
      status: 'active',
      logo_url: null,
    },
  ];

  const { data, error } = await supabase
    .from('brands')
    .insert(demoBrands)
    .select();

  if (error) throw error;
  return data;
}

export async function seedDemoProductData(vendorId: string) {
  const demoProducts = [
    {
      vendor_id: vendorId,
      name: 'Wireless Bluetooth Headphones',
      sku: 'WH-BT-001',
      category: 'Electronics',
      price: 2999,
      quantity: 50,
      description: 'Premium wireless headphones with active noise cancellation',
      image_url: null,
      status: 'active',
    },
    {
      vendor_id: vendorId,
      name: 'USB-C Fast Charging Cable',
      sku: 'USB-FC-001',
      category: 'Accessories',
      price: 499,
      quantity: 200,
      description: 'Durable USB-C cable with 65W fast charging support',
      image_url: null,
      status: 'active',
    },
    {
      vendor_id: vendorId,
      name: 'Adjustable Phone Stand',
      sku: 'PS-ADJ-001',
      category: 'Accessories',
      price: 799,
      quantity: 100,
      description: 'Premium aluminum phone stand for all devices',
      image_url: null,
      status: 'active',
    },
    {
      vendor_id: vendorId,
      name: 'Tempered Glass Screen Protector',
      sku: 'SP-TG-001',
      category: 'Protection',
      price: 199,
      quantity: 500,
      description: '9H hardness tempered glass screen protector',
      image_url: null,
      status: 'active',
    },
    {
      vendor_id: vendorId,
      name: 'Portable Power Bank 20000mAh',
      sku: 'PB-20K-001',
      category: 'Power',
      price: 1499,
      quantity: 75,
      description: 'High-capacity power bank with dual fast charging ports',
      image_url: null,
      status: 'active',
    },
  ];

  const { data, error } = await supabase
    .from('products')
    .insert(demoProducts)
    .select();

  if (error) throw error;
  return data;
}

export async function seedDemoOrderData(vendorId: string) {
  const demoOrders = [
    {
      vendor_id: vendorId,
      order_number: 'ORD-2026-001',
      channel: 'amazon',
      customer_name: 'Rajesh Kumar',
      customer_email: 'rajesh@example.com',
      status: 'delivered',
      total_amount: 5998,
      items_count: 2,
      notes: 'Delivered in excellent condition',
      order_date: new Date('2026-04-10').toISOString(),
    },
    {
      vendor_id: vendorId,
      order_number: 'ORD-2026-002',
      channel: 'flipkart',
      customer_name: 'Priya Singh',
      customer_email: 'priya@example.com',
      status: 'processing',
      total_amount: 2999,
      items_count: 1,
      notes: 'Currently being packed',
      order_date: new Date('2026-04-12').toISOString(),
    },
    {
      vendor_id: vendorId,
      order_number: 'ORD-2026-003',
      channel: 'meesho',
      customer_name: 'Amit Patel',
      customer_email: 'amit@example.com',
      status: 'shipped',
      total_amount: 7497,
      items_count: 3,
      notes: 'In transit',
      order_date: new Date('2026-04-13').toISOString(),
    },
    {
      vendor_id: vendorId,
      order_number: 'ORD-2026-004',
      channel: 'amazon',
      customer_name: 'Sneha Desai',
      customer_email: 'sneha@example.com',
      status: 'pending',
      total_amount: 3498,
      items_count: 2,
      notes: 'Awaiting payment confirmation',
      order_date: new Date('2026-04-14').toISOString(),
    },
  ];

  const { data, error } = await supabase
    .from('orders')
    .insert(demoOrders)
    .select();

  if (error) throw error;
  return data;
}

export async function seedDemoChannelData(vendorId: string) {
  const demoChannels = [
    {
      vendor_id: vendorId,
      name: 'Amazon India',
      platform: 'amazon',
      status: 'active',
      seller_id: 'DEMO-AMZ-IND-001',
      api_key: null,
      api_secret: null,
    },
    {
      vendor_id: vendorId,
      name: 'Flipkart Seller',
      platform: 'flipkart',
      status: 'active',
      seller_id: 'DEMO-FK-SELLER-001',
      api_key: null,
      api_secret: null,
    },
    {
      vendor_id: vendorId,
      name: 'Meesho Supplier',
      platform: 'meesho',
      status: 'active',
      seller_id: 'DEMO-MEESHO-SUP-001',
      api_key: null,
      api_secret: null,
    },
  ];

  const { data, error } = await supabase
    .from('channels')
    .insert(demoChannels)
    .select();

  if (error) throw error;
  return data;
}

export async function seedAllDemoData(vendorId: string) {
  const results = {
    brands: 0,
    products: 0,
    orders: 0,
    channels: 0,
    errors: [] as string[],
  };

  try {
    const brands = await seedDemoBrandData(vendorId);
    results.brands = brands?.length || 0;
  } catch (error) {
    results.errors.push(`Brands: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const products = await seedDemoProductData(vendorId);
    results.products = products?.length || 0;
  } catch (error) {
    results.errors.push(`Products: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const orders = await seedDemoOrderData(vendorId);
    results.orders = orders?.length || 0;
  } catch (error) {
    results.errors.push(`Orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const channels = await seedDemoChannelData(vendorId);
    results.channels = channels?.length || 0;
  } catch (error) {
    results.errors.push(`Channels: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
}
