export type AlertType = 'revenue_drop' | 'stockout_risk' | 'trend_reversal' | 'channel_shift' | 'cost_anomaly'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'new' | 'ongoing' | 'resolved'

export interface Alert {
  id: string
  vendorId: string
  type: AlertType
  severity: AlertSeverity
  metric: string
  baseline: number
  current: number
  change: number // percentage change
  recommendation: string
  confidence: number // 0-1
  timestamp: string
  updated_at?: string
  status: AlertStatus
}

export interface AlertMetrics {
  revenue: {
    baseline: number
    current: number
    byChannel: Record<string, { baseline: number; current: number }>
  }
  inventory: {
    stockoutRisk: Array<{ productId: string; daysToStockout: number }>
    lowStockCount: number
  }
  trend: {
    growth: number // percentage
    previousGrowth: number
  }
  channelConcentration: number // Gini coefficient 0-1
  costs: {
    baseline: number
    current: number
  }
}
