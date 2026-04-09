-- Phase 2: Supabase Schema & Authentication Setup
-- Migration: 001_init_schema.sql

-- Create ENUM types for role-based access control
CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'operations');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE return_status AS ENUM ('requested', 'approved', 'rejected');
CREATE TYPE settlement_status AS ENUM ('pending', 'processed');

-- 1. Users table (auth foundation)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'vendor',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on email for auth lookups
CREATE INDEX idx_users_email ON users(email);

-- 2. Vendors table
CREATE TABLE vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on user_id for FK lookups
CREATE INDEX idx_vendors_user_id ON vendors(user_id);

-- 3. Products table
CREATE TABLE products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on vendor_id and sku for lookups
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_sku ON products(sku);

-- 4. Orders table
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on product_id and status
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 5. Returns table
CREATE TABLE returns (
  return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status return_status NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on order_id and status
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_status ON returns(status);

-- 6. Settlements table
CREATE TABLE settlements (
  settlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  net_amount DECIMAL(10, 2) NOT NULL,
  status settlement_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on vendor_id and status
CREATE INDEX idx_settlements_vendor_id ON settlements(vendor_id);
CREATE INDEX idx_settlements_status ON settlements(status);

-- 7. Expenses table
CREATE TABLE expenses (
  expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on vendor_id for FK lookups
CREATE INDEX idx_expenses_vendor_id ON expenses(vendor_id);
