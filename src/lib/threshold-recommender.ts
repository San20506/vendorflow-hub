/**
 * Threshold Recommender Engine
 *
 * Analyzes alert dismissal patterns to recommend optimal sensitivity thresholds.
 * Uses alert fatigue metrics to identify over-sensitive and under-sensitive settings.
 */

import { Alert } from '@/types/alerts';
import { AnomalyType, SENSITIVITY_DEFAULTS } from '@/types/alert-sensitivity';
import { supabase } from '@/integrations/supabase/client';

export interface AlertFatigueMetrics {
  anomaly_type: AnomalyType;
  total_alerts: number;
  dismissed_count: number;
  dismiss_rate: number; // percentage (0-100)
  avg_time_to_dismiss_hours: number;
  last_alert_at: string;
}

export interface SensitivityRecommendation {
  anomaly_type: AnomalyType;
  current_threshold: number;
  recommended_threshold: number;
  confidence_score: number; // 0-1
  reasoning: string;
  dismiss_rate: number;
  sample_size: number;
}

export class ThresholdRecommender {
  /**
   * Analyze alert history to get fatigue metrics per anomaly type
   * Window: last 30 days to avoid stale data
   */
  static async analyzeAlertHistory(
    vendorId: string
  ): Promise<AlertFatigueMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('alert_fatigue_metrics')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('Failed to fetch alert fatigue metrics:', error);
        return [];
      }

      return (data || []).map((row) => ({
        anomaly_type: row.alert_type as AnomalyType,
        total_alerts: row.total_alerts,
        dismissed_count: row.dismissed_count,
        dismiss_rate: row.dismiss_rate,
        avg_time_to_dismiss_hours: row.avg_time_to_dismiss_hours || 0,
        last_alert_at: row.last_alert_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Calculate recommendation for a single anomaly type
   * Based on dismiss rate and sample size
   */
  static calculateRecommendation(
    anomalyType: AnomalyType,
    metrics: AlertFatigueMetrics | null,
    currentThreshold: number
  ): SensitivityRecommendation | null {
    if (!metrics || metrics.total_alerts < 10) {
      return null; // Insufficient data
    }

    const { dismiss_rate, total_alerts } = metrics;
    const sampleSize = total_alerts;

    // Determine confidence based on sample size
    let confidence: number;
    if (sampleSize < 10) {
      confidence = 0.3; // Very low
    } else if (sampleSize < 30) {
      confidence = 0.5; // Low
    } else if (sampleSize < 100) {
      confidence = 0.75; // Medium
    } else {
      confidence = 0.95; // High
    }

    // Determine recommended threshold based on dismiss rate
    let recommendedThreshold = currentThreshold;
    let reasoning = '';

    if (dismiss_rate > 60) {
      // Over-sensitive: too many false positives
      recommendedThreshold = Math.min(
        10,
        currentThreshold + 2
      );
      reasoning = `High false positive rate (${dismiss_rate.toFixed(0)}% dismissed). Suggest increase threshold to reduce noise.`;
    } else if (dismiss_rate > 40) {
      // Somewhat over-sensitive
      recommendedThreshold = Math.min(
        10,
        currentThreshold + 1
      );
      reasoning = `Moderate false positive rate (${dismiss_rate.toFixed(0)}% dismissed). Small increase may help.`;
    } else if (dismiss_rate < 10) {
      // Under-sensitive: might be missing real anomalies
      recommendedThreshold = Math.max(1, currentThreshold - 1);
      reasoning = `Low dismiss rate (${dismiss_rate.toFixed(0)}%). May be catching most real anomalies; slight decrease could catch more edge cases.`;
    } else {
      // Well-tuned (10-40% dismiss rate)
      recommendedThreshold = currentThreshold;
      reasoning = `Good balance (${dismiss_rate.toFixed(0)}% dismissed). Current threshold appears well-tuned.`;
    }

    // Only recommend if meaningful difference and confidence > 50%
    if (recommendedThreshold !== currentThreshold && confidence > 0.5) {
      return {
        anomaly_type,
        current_threshold: currentThreshold,
        recommended_threshold: recommendedThreshold,
        confidence_score: confidence,
        reasoning,
        dismiss_rate,
        sample_size: sampleSize,
      };
    }

    return null;
  }

  /**
   * Get recommendations for all anomaly types
   */
  static async getRecommendations(
    vendorId: string,
    currentThresholds: Record<AnomalyType, number>
  ): Promise<SensitivityRecommendation[]> {
    const metrics = await this.analyzeAlertHistory(vendorId);
    const metricsMap = new Map(metrics.map((m) => [m.anomaly_type, m]));

    const anomalyTypes: AnomalyType[] = [
      'revenue_drop',
      'stockout_risk',
      'trend_reversal',
      'channel_shift',
      'cost_anomaly',
    ];

    const recommendations: SensitivityRecommendation[] = [];

    for (const type of anomalyTypes) {
      const metric = metricsMap.get(type) || null;
      const current = currentThresholds[type];

      const rec = this.calculateRecommendation(type, metric, current);
      if (rec) {
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  /**
   * Save recommendation history for analytics
   */
  static async saveRecommendation(
    vendorId: string,
    recommendation: SensitivityRecommendation
  ): Promise<void> {
    try {
      await supabase.from('recommendation_history').insert({
        vendor_id: vendorId,
        alert_type: recommendation.anomaly_type,
        recommended_threshold: recommendation.recommended_threshold,
        current_threshold: recommendation.current_threshold,
        confidence_score: recommendation.confidence_score,
        reasoning: recommendation.reasoning,
      });
    } catch (error) {
      console.error('Failed to save recommendation:', error);
    }
  }

  /**
   * Mark recommendation as applied
   */
  static async markRecommendationApplied(
    vendorId: string,
    anomalyType: AnomalyType
  ): Promise<void> {
    try {
      await supabase
        .from('recommendation_history')
        .update({ applied_at: new Date().toISOString() })
        .eq('vendor_id', vendorId)
        .eq('alert_type', anomalyType)
        .is('applied_at', null)
        .order('shown_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Failed to mark recommendation applied:', error);
    }
  }
}
