/**
 * Campaign Engine
 *
 * Manages campaign creation, execution, and metrics tracking.
 */

import { supabase } from '@/integrations/supabase/client';
import { Campaign, CampaignMetrics, CampaignSegment, CampaignTemplate } from '@/types/campaigns';

export class CampaignEngine {
  /**
   * Create new campaign
   */
  static async createCampaign(
    vendorId: string,
    name: string,
    templateId: string,
    type: 'email' | 'sms' | 'in_app',
    segment: CampaignSegment
  ): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        vendor_id: vendorId,
        name,
        type,
        template_id: templateId,
        segment_config: segment,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Schedule campaign for future send
   */
  static async scheduleCampaign(
    campaignId: string,
    scheduledAt: Date
  ): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Execute campaign immediately
   */
  static async executeCampaign(campaignId: string): Promise<void> {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, campaign_templates(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;
    if (!campaign) throw new Error('Campaign not found');

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    // Initialize metrics
    await supabase
      .from('campaign_metrics')
      .insert({ campaign_id: campaignId, total_sent: 1 })
      .onConflict('campaign_id')
      .merge();

    // Log sent event
    await supabase
      .from('campaign_events')
      .insert({
        campaign_id: campaignId,
        event_type: 'sent',
      });
  }

  /**
   * Track campaign event (open, click, conversion)
   */
  static async trackEvent(
    campaignId: string,
    eventType: 'opened' | 'clicked' | 'converted',
    customerId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Log event
    await supabase
      .from('campaign_events')
      .insert({
        campaign_id: campaignId,
        customer_id: customerId,
        event_type: eventType,
        metadata,
      });

    // Update metrics
    const updatePayload: Record<string, number> = {};
    if (eventType === 'opened') {
      updatePayload['total_opened'] = supabase.rpc('increment', { campaign_id: campaignId, column: 'total_opened', amount: 1 });
    } else if (eventType === 'clicked') {
      updatePayload['total_clicked'] = supabase.rpc('increment', { campaign_id: campaignId, column: 'total_clicked', amount: 1 });
    } else if (eventType === 'converted') {
      updatePayload['total_conversions'] = supabase.rpc('increment', { campaign_id: campaignId, column: 'total_conversions', amount: 1 });
    }

    // Simple increment via update
    if (eventType === 'opened') {
      await supabase.from('campaign_metrics').update({ total_opened: supabase.raw('total_opened + 1') }).eq('campaign_id', campaignId);
    } else if (eventType === 'clicked') {
      await supabase.from('campaign_metrics').update({ total_clicked: supabase.raw('total_clicked + 1') }).eq('campaign_id', campaignId);
    } else if (eventType === 'converted') {
      await supabase.from('campaign_metrics').update({ total_conversions: supabase.raw('total_conversions + 1') }).eq('campaign_id', campaignId);
    }
  }

  /**
   * Get campaign metrics
   */
  static async getMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get campaign performance view
   */
  static async getPerformance(vendorId: string) {
    const { data, error } = await supabase
      .from('campaign_performance')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create campaign template
   */
  static async createTemplate(
    vendorId: string,
    name: string,
    type: 'email' | 'sms' | 'in_app',
    content: string,
    subject?: string
  ): Promise<CampaignTemplate> {
    const { data, error } = await supabase
      .from('campaign_templates')
      .insert({
        vendor_id: vendorId,
        name,
        type,
        content,
        subject,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * List templates for vendor
   */
  static async getTemplates(vendorId: string): Promise<CampaignTemplate[]> {
    const { data, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('vendor_id', vendorId);

    if (error) throw error;
    return data || [];
  }
}
