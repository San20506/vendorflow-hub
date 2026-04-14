-- Migration: 009_platform_imports.sql
-- Adds platform-specific order and settlement tables for marketplace data import
-- Supports: Flipkart, Meesho, Firstcry, Amazon

CREATE TYPE marketplace_platform AS ENUM ('flipkart', 'meesho', 'firstcry', 'amazon');

-- Platform orders: captures real marketplace order data from all portals
CREATE TABLE platform_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  platform              marketplace_platform NOT NULL,
  platform_order_id     TEXT NOT NULL,
  platform_order_item_id TEXT,
  order_date            TIMESTAMPTZ,
  sku                   TEXT,
  product_name          TEXT,
  quantity              INTEGER DEFAULT 1,
  mrp                   DECIMAL(12, 2),
  sale_amount           DECIMAL(12, 2),
  status                TEXT,                  -- DELIVERED, RETURNED, CANCELLED, RTO, etc.
  return_reason         TEXT,
  hsn_code              TEXT,
  category              TEXT,
  subcategory           TEXT,
  fulfillment_type      TEXT,                  -- FBF / Seller / etc.
  raw_data              JSONB,                 -- full original row
  imported_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, platform, platform_order_id, platform_order_item_id)
);

CREATE INDEX idx_platform_orders_vendor_id   ON platform_orders(vendor_id);
CREATE INDEX idx_platform_orders_platform    ON platform_orders(platform);
CREATE INDEX idx_platform_orders_order_date  ON platform_orders(order_date);
CREATE INDEX idx_platform_orders_sku         ON platform_orders(sku);
CREATE INDEX idx_platform_orders_status      ON platform_orders(status);

-- Platform settlements: captures payment/settlement data from all portals
CREATE TABLE platform_settlements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  platform          marketplace_platform NOT NULL,
  settlement_ref    TEXT,                      -- NEFT ID / payment ref
  platform_order_id TEXT,
  payment_date      TIMESTAMPTZ,
  sale_amount       DECIMAL(12, 2) DEFAULT 0,
  commission        DECIMAL(12, 2) DEFAULT 0,
  shipping_fee      DECIMAL(12, 2) DEFAULT 0,
  tcs               DECIMAL(12, 2) DEFAULT 0,
  tds               DECIMAL(12, 2) DEFAULT 0,
  other_deductions  DECIMAL(12, 2) DEFAULT 0,
  net_settlement    DECIMAL(12, 2) DEFAULT 0,
  raw_data          JSONB,
  imported_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, platform, settlement_ref, platform_order_id)
);

CREATE INDEX idx_platform_settlements_vendor_id    ON platform_settlements(vendor_id);
CREATE INDEX idx_platform_settlements_platform     ON platform_settlements(platform);
CREATE INDEX idx_platform_settlements_payment_date ON platform_settlements(payment_date);

-- RLS: vendors can only see their own data
ALTER TABLE platform_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_own_platform_orders" ON platform_orders
  FOR ALL USING (
    vendor_id IN (
      SELECT vendor_id FROM vendors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vendor_own_platform_settlements" ON platform_settlements
  FOR ALL USING (
    vendor_id IN (
      SELECT vendor_id FROM vendors WHERE user_id = auth.uid()
    )
  );
