/**
 * Alert Sensitivity Settings Types
 *
 * Defines threshold configuration for vendor-specific anomaly detection filtering.
 * Sensitivity scale: 1 (ultra-sensitive, most alerts) to 10 (strict, few alerts)
 */

import { AlertType } from './alerts';

export type AnomalyType = AlertType;

export interface SensitivityThreshold {
  anomaly_type: AnomalyType;
  sensitivity_level: number; // 1-10
  description?: string;
}

export interface SensitivitySettings {
  vendor_id: string;
  thresholds: Record<AnomalyType, number>; // sensitivity_level per type
  created_at: string;
  updated_at: string;
}

export interface SensitivityAuditLog {
  vendor_id: string;
  previous_settings: Record<AnomalyType, number>;
  new_settings: Record<AnomalyType, number>;
  changed_at: string;
}

export const ANOMALY_DESCRIPTIONS: Record<AnomalyType, string> = {
  revenue_drop: 'Sudden decrease in sales/revenue',
  stockout_risk: 'Products at risk of running out of stock',
  trend_reversal: 'Growth trend reversal or decline',
  channel_shift: 'Sales shifting away from typical channels',
  cost_anomaly: 'Unexpected increase in costs or expenses',
};

export const SENSITIVITY_DEFAULTS: Record<AnomalyType, number> = {
  revenue_drop: 6,
  stockout_risk: 5,
  trend_reversal: 6,
  channel_shift: 5,
  cost_anomaly: 7,
};

export const SENSITIVITY_LABELS: Record<number, string> = {
  1: 'Ultra Sensitive',
  2: 'Very Sensitive',
  3: 'Sensitive',
  4: 'Somewhat Sensitive',
  5: 'Moderate',
  6: 'Standard',
  7: 'Strict',
  8: 'Very Strict',
  9: 'Extra Strict',
  10: 'Extreme',
};
