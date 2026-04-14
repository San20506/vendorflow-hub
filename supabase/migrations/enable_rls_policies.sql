-- Phase 08-01: Row-Level Security (RLS) & Multi-Tenant Hardening
-- Migration: enable_rls_policies.sql
-- Purpose: Enforce database-layer vendor isolation via RLS policies

-- ============================================================================
-- STEP 1: Create foundation tables (user_profiles, audit_logs) if not exists
-- ============================================================================

-- Create user_profiles table (maps auth users to vendors)
-- This bridges Supabase auth.users with our business vendors
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  role TEXT DEFAULT 'vendor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_vendor_id ON user_profiles(vendor_id);

-- Create audit_logs table (tracks all business operations for compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,  -- 'bulk_delete', 'bulk_update', 'restore', 'import', etc.
  entity_type TEXT,              -- 'products', 'orders', 'settlements', etc.
  record_id UUID,                -- single record affected
  record_count INTEGER,          -- bulk operations affecting multiple records
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,                -- operation-specific data (deletion_reason, version_number, etc.)
  status TEXT DEFAULT 'success'  -- 'success', 'failure', 'pending'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_vendor_id ON audit_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

COMMENT ON TABLE user_profiles IS 'Maps Supabase auth users to business vendors for RLS policy enforcement';
COMMENT ON TABLE audit_logs IS 'Compliance audit trail tracking all vendor data operations';

-- ============================================================================
-- STEP 2: Enable RLS on all vendor-scoped tables
-- ============================================================================

-- Products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Settlements table
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Deleted records history table
ALTER TABLE deleted_records_history ENABLE ROW LEVEL SECURITY;

-- Audit logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Vendor settings table (if exists)
ALTER TABLE IF EXISTS vendor_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS Policies for PRODUCTS table
-- ============================================================================

-- SELECT: Users can view products from their vendor only
CREATE POLICY "vendors_select_own_products" ON products
  FOR SELECT
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can insert products for their vendor only
CREATE POLICY "vendors_insert_own_products" ON products
  FOR INSERT
  WITH CHECK (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update products from their vendor only
CREATE POLICY "vendors_update_own_products" ON products
  FOR UPDATE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete products from their vendor only
CREATE POLICY "vendors_delete_own_products" ON products
  FOR DELETE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Create RLS Policies for ORDERS table
-- ============================================================================

-- SELECT: Users can view orders for products in their vendor
CREATE POLICY "vendors_select_own_orders" ON orders
  FOR SELECT
  USING (
    product_id IN (
      SELECT product_id FROM products
      WHERE vendor_id = (
        SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Users can insert orders for products in their vendor
CREATE POLICY "vendors_insert_own_orders" ON orders
  FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT product_id FROM products
      WHERE vendor_id = (
        SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE: Users can update orders for products in their vendor
CREATE POLICY "vendors_update_own_orders" ON orders
  FOR UPDATE
  USING (
    product_id IN (
      SELECT product_id FROM products
      WHERE vendor_id = (
        SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- DELETE: Users can delete orders for products in their vendor
CREATE POLICY "vendors_delete_own_orders" ON orders
  FOR DELETE
  USING (
    product_id IN (
      SELECT product_id FROM products
      WHERE vendor_id = (
        SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 5: Create RLS Policies for SETTLEMENTS table
-- ============================================================================

-- SELECT: Users can view settlements for their vendor only
CREATE POLICY "vendors_select_own_settlements" ON settlements
  FOR SELECT
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can insert settlements for their vendor only
CREATE POLICY "vendors_insert_own_settlements" ON settlements
  FOR INSERT
  WITH CHECK (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update settlements for their vendor only
CREATE POLICY "vendors_update_own_settlements" ON settlements
  FOR UPDATE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete settlements for their vendor only
CREATE POLICY "vendors_delete_own_settlements" ON settlements
  FOR DELETE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 6: Create RLS Policies for DELETED_RECORDS_HISTORY table
-- ============================================================================

-- SELECT: Users can view deleted record history for their vendor
CREATE POLICY "vendors_select_own_deleted_records" ON deleted_records_history
  FOR SELECT
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can insert deletion records for their vendor
CREATE POLICY "vendors_insert_own_deleted_records" ON deleted_records_history
  FOR INSERT
  WITH CHECK (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update deletion records for their vendor (restore operations)
CREATE POLICY "vendors_update_own_deleted_records" ON deleted_records_history
  FOR UPDATE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete deletion records for their vendor (cleanup)
CREATE POLICY "vendors_delete_own_deleted_records" ON deleted_records_history
  FOR DELETE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: Create RLS Policies for AUDIT_LOGS table
-- ============================================================================

-- SELECT: Users can view audit logs for their vendor only
CREATE POLICY "vendors_select_own_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can insert audit log entries for their vendor (via service role)
CREATE POLICY "vendors_insert_own_audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update audit logs for their vendor (status changes)
CREATE POLICY "vendors_update_own_audit_logs" ON audit_logs
  FOR UPDATE
  USING (
    vendor_id = (
      SELECT vendor_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- DELETE: Restrict audit log deletion (immutable audit trail)
CREATE POLICY "vendors_cannot_delete_audit_logs" ON audit_logs
  FOR DELETE
  USING (false);  -- Nobody can delete audit logs

-- ============================================================================
-- STEP 8: Service role bypass (for edge functions and admin operations)
-- ============================================================================

-- Grant service_role (used by edge functions) full access (bypasses RLS)
-- This is intentional - edge functions use service_role to perform admin operations
-- The auth.uid() check in application code provides the actual security layer

-- RLS is now enforced at the database layer
-- Application-level vendor_id filtering in code acts as defense-in-depth

-- ============================================================================
-- STEP 9: Documentation
-- ============================================================================

COMMENT ON POLICY "vendors_select_own_products" ON products IS 'RLS: Vendors can only SELECT products they own';
COMMENT ON POLICY "vendors_select_own_orders" ON orders IS 'RLS: Vendors can only SELECT orders for their products';
COMMENT ON POLICY "vendors_select_own_settlements" ON settlements IS 'RLS: Vendors can only SELECT settlements for their vendor_id';
COMMENT ON POLICY "vendors_select_own_deleted_records" ON deleted_records_history IS 'RLS: Vendors can only view deletion history for their vendor_id';
COMMENT ON POLICY "vendors_select_own_audit_logs" ON audit_logs IS 'RLS: Vendors can only view audit logs for their vendor_id';
