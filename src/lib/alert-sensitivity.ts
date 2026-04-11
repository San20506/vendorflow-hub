/**
 * Alert Sensitivity Engine
 *
 * Applies vendor-specific threshold filters to alert sets.
 * Sensitivity scale: 1-10 where 1 = ultra-sensitive (most alerts), 10 = strict (few alerts)
 */

import { Alert } from '@/types/alerts';
import {
  AnomalyType,
  SENSITIVITY_DEFAULTS,
  SensitivitySettings,
  ANOMALY_DESCRIPTIONS,
} from '@/types/alert-sensitivity';
import { supabase } from '@/integrations/supabase/client';

export class ThresholdEngine {
  /**
   * Apply sensitivity filters to alert array
   * Filters alerts based on their severity relative to vendor sensitivity settings
   */
  static applySensitivity(
    alerts: Alert[],
    thresholds: Record<AnomalyType, number>
  ): Alert[] {
    return alerts.filter((alert) => {
      const anomalyType = this.getAnomalyType(alert);
      if (!anomalyType) return true; // Keep alerts without anomaly type

      const threshold = thresholds[anomalyType];
      return this.isAlertAboveThreshold(alert, threshold);
    });
  }

  /**
   * Determine if alert meets sensitivity threshold
   * Alerts are kept if severity >= threshold_adjusted_severity
   *
   * Sensitivity mapping:
   * - Sensitivity 1 (ultra-sensitive): Shows all alerts (threshold_severity = 1)
   * - Sensitivity 5 (moderate): Shows 50%+ severity alerts (threshold_severity = 5)
   * - Sensitivity 10 (strict): Shows only 90%+ severity alerts (threshold_severity = 9)
   */
  static isAlertAboveThreshold(alert: Alert, sensitivity: number): boolean {
    // Map sensitivity (1-10) to required severity (1-10)
    // Linear mapping: severity_threshold = (sensitivity - 1) * 0.9 + 1
    // But simpler: just use sensitivity as minimum severity
    const requiredSeverity = sensitivity;

    // Infer severity from alert metadata
    const alertSeverity = this.calculateAlertSeverity(alert);
    return alertSeverity >= requiredSeverity;
  }

  /**
   * Calculate numeric severity (1-10) from alert
   * Based on percentage change and confidence score
   */
  private static calculateAlertSeverity(alert: Alert): number {
    // Use absolute percentage change as primary indicator
    const absChange = Math.abs(alert.change);

    // Weight with confidence score
    const weightedSeverity = (absChange / 100) * alert.confidence;

    // Map to 1-10 scale
    // 0-1% change @ 80% confidence = severity ~1
    // 20%+ change @ 100% confidence = severity ~10
    const severity = Math.min(
      10,
      Math.max(1, Math.ceil(weightedSeverity * 50))
    );

    return severity;
  }

  /**
   * Extract anomaly type from alert
   */
  private static getAnomalyType(alert: Alert): AnomalyType | null {
    const type = alert.type;
    const validTypes: AnomalyType[] = [
      'revenue_drop',
      'stockout_risk',
      'trend_reversal',
      'channel_shift',
      'cost_anomaly',
    ];

    return validTypes.includes(type as AnomalyType)
      ? (type as AnomalyType)
      : null;
  }

  /**
   * Get default sensitivity settings for new vendor
   */
  static getSensitivityDefaults(): Record<AnomalyType, number> {
    return { ...SENSITIVITY_DEFAULTS };
  }

  /**
   * Analyze alert history to recommend optimal threshold
   * (simplified: returns current default)
   */
  static getRecommendedThreshold(
    anomalyType: AnomalyType,
    alertHistory: Alert[]
  ): number {
    if (alertHistory.length === 0) {
      return SENSITIVITY_DEFAULTS[anomalyType];
    }

    // Filter alerts by type
    const typeAlerts = alertHistory.filter(
      (a) => this.getAnomalyType(a) === anomalyType
    );

    if (typeAlerts.length === 0) {
      return SENSITIVITY_DEFAULTS[anomalyType];
    }

    // Calculate median severity for type
    const severities = typeAlerts.map((a) => this.calculateAlertSeverity(a));
    severities.sort((a, b) => a - b);
    const medianSeverity = severities[Math.floor(severities.length / 2)];

    // Recommend threshold at 75th percentile (keep top 25% alerts)
    return Math.min(10, Math.max(1, Math.ceil(medianSeverity * 0.75)));
  }

  /**
   * Convert settings object to thresholds map
   */
  static settingsToThresholds(
    settings: SensitivitySettings
  ): Record<AnomalyType, number> {
    return settings.thresholds;
  }
}

import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch vendor sensitivity settings from Supabase
 * Returns defaults if no custom settings found
 */
export async function fetchVendorSensitivitySettings(
  vendorId: string
): Promise<Record<AnomalyType, number>> {
  try {
    const { data, error } = await supabase
      .from('alert_sensitivity_settings')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();

    if (error || !data) {
      // No settings found, return defaults
      return ThresholdEngine.getSensitivityDefaults();
    }

    // Extract thresholds from database columns
    return {
      revenue_drop: data.revenue_drop_sensitivity,
      stockout_risk: data.stockout_risk_sensitivity,
      trend_reversal: data.trend_reversal_sensitivity,
      channel_shift: data.channel_shift_sensitivity,
      cost_anomaly: data.cost_anomaly_sensitivity,
    };
  } catch {
    return ThresholdEngine.getSensitivityDefaults();
  }
}

/**
 * Save vendor sensitivity settings to Supabase
 */
export async function saveVendorSensitivitySettings(
  vendorId: string,
  thresholds: Record<AnomalyType, number>
): Promise<SensitivitySettings> {
  // Check if settings exist
  const { data: existing } = await supabase
    .from('alert_sensitivity_settings')
    .select('id')
    .eq('vendor_id', vendorId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('alert_sensitivity_settings')
      .update({
        revenue_drop_sensitivity: thresholds.revenue_drop,
        stockout_risk_sensitivity: thresholds.stockout_risk,
        trend_reversal_sensitivity: thresholds.trend_reversal,
        channel_shift_sensitivity: thresholds.channel_shift,
        cost_anomaly_sensitivity: thresholds.cost_anomaly,
      })
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (error) throw error;
    return mapDatabaseToSettings(data);
  } else {
    // Create new
    const { data, error } = await supabase
      .from('alert_sensitivity_settings')
      .insert({
        vendor_id: vendorId,
        revenue_drop_sensitivity: thresholds.revenue_drop,
        stockout_risk_sensitivity: thresholds.stockout_risk,
        trend_reversal_sensitivity: thresholds.trend_reversal,
        channel_shift_sensitivity: thresholds.channel_shift,
        cost_anomaly_sensitivity: thresholds.cost_anomaly,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDatabaseToSettings(data);
  }
}

/**
 * Map database row to SensitivitySettings type
 */
function mapDatabaseToSettings(row: any): SensitivitySettings {
  return {
    vendor_id: row.vendor_id,
    thresholds: {
      revenue_drop: row.revenue_drop_sensitivity,
      stockout_risk: row.stockout_risk_sensitivity,
      trend_reversal: row.trend_reversal_sensitivity,
      channel_shift: row.channel_shift_sensitivity,
      cost_anomaly: row.cost_anomaly_sensitivity,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
