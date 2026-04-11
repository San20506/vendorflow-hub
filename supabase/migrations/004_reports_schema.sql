-- Report preferences table for vendor-configured report schedules
CREATE TABLE report_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  report_type VARCHAR NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  enabled BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '["email"]'::jsonb,
  sms_phone VARCHAR,
  slack_webhook_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- One preference per vendor per report type
  UNIQUE(vendor_id, report_type)
);

-- Report execution history and audit trail
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  report_type VARCHAR NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  generated_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  channels_sent JSONB,
  status VARCHAR NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_report_preferences_vendor_id ON report_preferences(vendor_id);
CREATE INDEX idx_report_preferences_enabled ON report_preferences(enabled);
CREATE INDEX idx_report_history_vendor_id ON report_history(vendor_id);
CREATE INDEX idx_report_history_generated_at ON report_history(generated_at DESC);
CREATE INDEX idx_report_history_status ON report_history(status);
