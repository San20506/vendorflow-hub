/**
 * Campaign Management Types
 */

export type CampaignType = 'email' | 'sms' | 'in_app';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'paused';
export type SegmentationType = 'all_customers' | 'by_channel' | 'by_recency' | 'by_value';

export interface CampaignTemplate {
  id: string;
  name: string;
  type: CampaignType;
  subject?: string; // for email
  content: string;
  created_at: string;
}

export interface CampaignSegment {
  type: SegmentationType;
  filters?: {
    channel_ids?: string[];
    min_purchases?: number;
    max_days_since_purchase?: number;
    min_revenue?: number;
  };
}

export interface Campaign {
  id: string;
  vendor_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  template_id: string;
  segment: CampaignSegment;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_conversions: number;
  total_revenue?: number;
  open_rate: number; // percentage
  click_rate: number; // percentage
  conversion_rate: number; // percentage
  roi?: number; // percentage
  updated_at: string;
}

export interface CampaignMetric {
  campaign_id: string;
  customer_id: string;
  event_type: 'sent' | 'opened' | 'clicked' | 'converted';
  event_at: string;
  metadata?: Record<string, any>;
}
