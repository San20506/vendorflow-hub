-- Alerts table for real-time anomaly detection
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  alert_type VARCHAR NOT NULL,
  severity VARCHAR NOT NULL DEFAULT 'warning', -- 'critical', 'warning', 'info'
  metric VARCHAR NOT NULL,
  baseline FLOAT NOT NULL,
  current_value FLOAT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  recommendation TEXT,
  status VARCHAR DEFAULT 'new', -- 'new', 'ongoing', 'resolved'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  dismissed_at TIMESTAMP,

  -- Deduplication constraint: only one active alert per metric per vendor
  UNIQUE(vendor_id, alert_type, metric)
);

-- Index for fast alert retrieval by vendor
CREATE INDEX idx_alerts_vendor_id ON alerts(vendor_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- Table for alert history (audit trail)
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  action VARCHAR NOT NULL, -- 'created', 'updated', 'dismissed', 'resolved'
  old_status VARCHAR,
  new_status VARCHAR,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_history_vendor_id ON alert_history(vendor_id);
CREATE INDEX idx_alert_history_alert_id ON alert_history(alert_id);
