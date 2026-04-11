-- Phase 3: Channel Connectors Schema Extension
-- Migration: 002_channels_schema.sql
-- Adds support for multi-channel product sync (Shopify, Amazon, WooCommerce)

-- Create ENUM types for channel platforms and sync status
CREATE TYPE channel_platform AS ENUM ('shopify', 'amazon', 'woocommerce');
CREATE TYPE sync_status AS ENUM ('idle', 'syncing', 'error');

-- 1. Channels table - stores connected e-commerce accounts
CREATE TABLE channels (
  channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  platform channel_platform NOT NULL,
  external_account_id VARCHAR(255) NOT NULL,  -- e.g., "mystore.myshopify.com"
  access_token TEXT NOT NULL,  -- Stored encrypted via pgcrypto or Supabase Vault
  refresh_token TEXT,  -- Optional, for platforms requiring token refresh
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status sync_status NOT NULL DEFAULT 'idle',
  sync_error TEXT,  -- Error message if sync_status = 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, platform, external_account_id)  -- Prevent duplicate connections
);

-- Indexes on channels
CREATE INDEX idx_channels_vendor_id ON channels(vendor_id);
CREATE INDEX idx_channels_platform ON channels(platform);
CREATE INDEX idx_channels_status ON channels(sync_status);

-- 2. Extend products table with channel metadata
ALTER TABLE products ADD COLUMN channel_id UUID REFERENCES channels(channel_id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN external_product_id VARCHAR(255);  -- e.g., Shopify product ID

-- Add unique constraint to prevent duplicate syncs of same external product
ALTER TABLE products ADD CONSTRAINT unique_channel_product UNIQUE(channel_id, external_product_id);

-- Indexes on extended products columns
CREATE INDEX idx_products_channel_id ON products(channel_id);
CREATE INDEX idx_products_external_id ON products(external_product_id);

-- 3. Update products updated_at trigger (if not exists)
-- This ensures updated_at is auto-updated on any product change
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- 4. Update channels updated_at trigger (auto-update on any channel change)
CREATE OR REPLACE FUNCTION update_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER channels_updated_at_trigger
BEFORE UPDATE ON channels
FOR EACH ROW
EXECUTE FUNCTION update_channels_updated_at();
