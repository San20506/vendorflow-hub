-- Campaign Management Schema

CREATE TABLE IF NOT EXISTS campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'in_app')),
  subject text, -- for email
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_vendor_id ON campaign_templates(vendor_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'in_app')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'paused')),
  template_id uuid NOT NULL,
  segment_config jsonb, -- stores SegmentationType and filters
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES campaign_templates(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_campaigns_vendor_id ON campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  total_sent int NOT NULL DEFAULT 0,
  total_opened int NOT NULL DEFAULT 0,
  total_clicked int NOT NULL DEFAULT 0,
  total_conversions int NOT NULL DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);

CREATE TABLE IF NOT EXISTS campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  customer_id text, -- email or phone
  event_type text NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'converted')),
  event_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON campaign_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_event_at ON campaign_events(campaign_id, event_at);

-- Auto-update trigger for campaigns updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at_trigger ON campaigns;
CREATE TRIGGER campaigns_updated_at_trigger
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- View for campaign performance metrics
CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  c.id,
  c.vendor_id,
  c.name,
  c.type,
  c.status,
  cm.total_sent,
  cm.total_opened,
  cm.total_clicked,
  cm.total_conversions,
  cm.total_revenue,
  CASE WHEN cm.total_sent > 0
    THEN ROUND((cm.total_opened::numeric / cm.total_sent) * 100, 2)
    ELSE 0
  END as open_rate,
  CASE WHEN cm.total_sent > 0
    THEN ROUND((cm.total_clicked::numeric / cm.total_sent) * 100, 2)
    ELSE 0
  END as click_rate,
  CASE WHEN cm.total_sent > 0
    THEN ROUND((cm.total_conversions::numeric / cm.total_sent) * 100, 2)
    ELSE 0
  END as conversion_rate,
  c.created_at,
  c.sent_at
FROM campaigns c
LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id;
