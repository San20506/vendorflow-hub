-- Alert Dismissal Tracking Schema
-- Tracks when and why alerts are dismissed for recommendation engine training

-- Add dismissal tracking columns to alert_history if they don't exist
ALTER TABLE alert_history
ADD COLUMN IF NOT EXISTS dismissed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dismissed_by text,
ADD COLUMN IF NOT EXISTS dismissal_reason text CHECK (
  dismissal_reason IN ('false_positive', 'already_addressed', 'low_priority', 'other', NULL)
);

-- Create index for dismissal queries
CREATE INDEX IF NOT EXISTS idx_alert_history_dismissed_at ON alert_history(vendor_id, dismissed_at)
WHERE dismissed_at IS NOT NULL;

-- Alert fatigue metrics view
-- Shows dismissal rate per vendor per anomaly type
CREATE OR REPLACE VIEW alert_fatigue_metrics AS
SELECT
  vendor_id,
  alert_type,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN dismissed_at IS NOT NULL THEN 1 END) as dismissed_count,
  ROUND(
    COUNT(CASE WHEN dismissed_at IS NOT NULL THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
    2
  ) as dismiss_rate,
  AVG(CASE WHEN dismissed_at IS NOT NULL THEN
    EXTRACT(EPOCH FROM (dismissed_at - created_at)) / 3600.0
  END) as avg_time_to_dismiss_hours,
  MAX(created_at) as last_alert_at
FROM alert_history
WHERE created_at >= now() - interval '30 days'
GROUP BY vendor_id, alert_type;

-- Recommendation tracking table
CREATE TABLE IF NOT EXISTS recommendation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  alert_type text NOT NULL,

  -- Recommendation details
  recommended_threshold int NOT NULL CHECK (recommended_threshold >= 1 AND recommended_threshold <= 10),
  current_threshold int NOT NULL,
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning text,

  -- Tracking
  shown_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_at timestamp with time zone,
  dismissed_at timestamp with time zone,

  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recommendation_vendor_id ON recommendation_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_shown_at ON recommendation_history(shown_at);
