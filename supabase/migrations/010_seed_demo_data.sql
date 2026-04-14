-- Auto-seed demo data on first deployment
-- This migration runs once and populates the database with sample data for testing

-- Get or create a default vendor ID for the admin user
-- In production, this runs after users are created, so we seed with data

-- Seed demo brands
INSERT INTO public.brands (name, about, status)
VALUES
  ('Premium Electronics', 'High-quality electronics and gadgets for modern lifestyle', 'active'),
  ('Smart Home Solutions', 'IoT devices and smart home automation products', 'active'),
  ('Tech Accessories Pro', 'Professional tech accessories and peripherals', 'active')
ON CONFLICT DO NOTHING;

-- Seed demo products
INSERT INTO public.products (name, sku, category, base_price, mrp, image_url, status)
VALUES
  ('Wireless Bluetooth Headphones', 'WH-BT-001', 'Electronics', 2500, 2999, NULL, 'active'),
  ('USB-C Fast Charging Cable', 'USB-FC-001', 'Accessories', 400, 499, NULL, 'active'),
  ('Adjustable Phone Stand', 'PS-ADJ-001', 'Accessories', 650, 799, NULL, 'active'),
  ('Tempered Glass Screen Protector', 'SP-TG-001', 'Protection', 150, 199, NULL, 'active'),
  ('Portable Power Bank 20000mAh', 'PB-20K-001', 'Power', 1200, 1499, NULL, 'active')
ON CONFLICT (sku) DO NOTHING;

-- Seed demo orders
INSERT INTO public.orders (order_number, portal, customer_name, customer_email, status, total_amount, order_date)
VALUES
  ('ORD-2026-001', 'amazon', 'Rajesh Kumar', 'rajesh@example.com', 'delivered', 5998, NOW() - INTERVAL '4 days'),
  ('ORD-2026-002', 'flipkart', 'Priya Singh', 'priya@example.com', 'processing', 2999, NOW() - INTERVAL '2 days'),
  ('ORD-2026-003', 'meesho', 'Amit Patel', 'amit@example.com', 'shipped', 7497, NOW() - INTERVAL '1 day'),
  ('ORD-2026-004', 'amazon', 'Sneha Desai', 'sneha@example.com', 'pending', 3498, NOW())
ON CONFLICT (order_number) DO NOTHING;
