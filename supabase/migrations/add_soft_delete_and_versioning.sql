-- Soft-delete with 5-level rollback versioning for compliance & recovery
-- Phase 07-02: Delete Safety with Rollback

-- Add soft-delete columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Add soft-delete columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Add soft-delete columns to settlements table
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Create deleted_records_history table for storing 5-level rollback snapshots
CREATE TABLE IF NOT EXISTS deleted_records_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('products', 'orders', 'settlements')),
  version_number INTEGER NOT NULL CHECK (version_number >= 1 AND version_number <= 5),
  snapshot JSONB NOT NULL,
  deleted_by UUID NOT NULL,
  deleted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  restored_at TIMESTAMP NULL,
  vendor_id UUID NOT NULL,

  -- Unique constraint: one version per record per vendor
  CONSTRAINT unique_vendor_record_version UNIQUE (vendor_id, record_id, version_number),

  -- Foreign key to vendor (implicit through vendor_id usage)
  CONSTRAINT fk_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

-- Create index for fast version lookup by vendor, record, and version order
CREATE INDEX IF NOT EXISTS idx_deleted_records_vendor_record_version
  ON deleted_records_history (vendor_id, record_id, version_number DESC);

-- Create index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_deleted_records_deleted_at
  ON deleted_records_history (deleted_at DESC, vendor_id);

-- Add comment for documentation
COMMENT ON TABLE deleted_records_history IS 'Soft-delete with 5-level rollback history for compliance and recovery. Stores JSON snapshots of deleted records with FIFO rotation (oldest purged when 6th delete encountered).';
COMMENT ON COLUMN deleted_records_history.snapshot IS 'Full record state at time of deletion, stored as JSON for restoration';
COMMENT ON COLUMN deleted_records_history.version_number IS 'Version 1-5, oldest purged when 6th delete occurs (FIFO rotation)';
