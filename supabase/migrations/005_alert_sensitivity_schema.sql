-- Alert Sensitivity Settings Schema
-- Stores vendor-specific anomaly detection threshold configurations

CREATE TABLE IF NOT EXISTS alert_sensitivity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,

  -- Sensitivity levels (1-10) per alert type
  revenue_drop_sensitivity int NOT NULL DEFAULT 6 CHECK (revenue_drop_sensitivity >= 1 AND revenue_drop_sensitivity <= 10),
  stockout_risk_sensitivity int NOT NULL DEFAULT 5 CHECK (stockout_risk_sensitivity >= 1 AND stockout_risk_sensitivity <= 10),
  trend_reversal_sensitivity int NOT NULL DEFAULT 6 CHECK (trend_reversal_sensitivity >= 1 AND trend_reversal_sensitivity <= 10),
  channel_shift_sensitivity int NOT NULL DEFAULT 5 CHECK (channel_shift_sensitivity >= 1 AND channel_shift_sensitivity <= 10),
  cost_anomaly_sensitivity int NOT NULL DEFAULT 7 CHECK (cost_anomaly_sensitivity >= 1 AND cost_anomaly_sensitivity <= 10),

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  UNIQUE(vendor_id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_alert_sensitivity_vendor_id ON alert_sensitivity_settings(vendor_id);

-- Audit log table for sensitivity changes
CREATE TABLE IF NOT EXISTS alert_sensitivity_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,

  -- Previous and new settings
  previous_settings jsonb NOT NULL,
  new_settings jsonb NOT NULL,

  changed_by text, -- user identifier (optional)
  changed_at timestamp with time zone NOT NULL DEFAULT now(),

  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_sensitivity_audit_vendor_id ON alert_sensitivity_audit(vendor_id);
CREATE INDEX IF NOT EXISTS idx_alert_sensitivity_audit_changed_at ON alert_sensitivity_audit(changed_at);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_alert_sensitivity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alert_sensitivity_updated_at_trigger ON alert_sensitivity_settings;
CREATE TRIGGER alert_sensitivity_updated_at_trigger
  BEFORE UPDATE ON alert_sensitivity_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_sensitivity_updated_at();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_alert_sensitivity_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO alert_sensitivity_audit (
    vendor_id,
    previous_settings,
    new_settings
  ) VALUES (
    NEW.vendor_id,
    jsonb_build_object(
      'revenue_drop', OLD.revenue_drop_sensitivity,
      'stockout_risk', OLD.stockout_risk_sensitivity,
      'trend_reversal', OLD.trend_reversal_sensitivity,
      'channel_shift', OLD.channel_shift_sensitivity,
      'cost_anomaly', OLD.cost_anomaly_sensitivity
    ),
    jsonb_build_object(
      'revenue_drop', NEW.revenue_drop_sensitivity,
      'stockout_risk', NEW.stockout_risk_sensitivity,
      'trend_reversal', NEW.trend_reversal_sensitivity,
      'channel_shift', NEW.channel_shift_sensitivity,
      'cost_anomaly', NEW.cost_anomaly_sensitivity
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alert_sensitivity_audit_trigger ON alert_sensitivity_settings;
CREATE TRIGGER alert_sensitivity_audit_trigger
  AFTER UPDATE ON alert_sensitivity_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_alert_sensitivity_change();
