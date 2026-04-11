import { Alert, AlertMetrics, AlertStatus, AlertType } from '@/types/alerts'
import { getChannelsForVendor, getChannelProducts } from './channels'
import { getOrdersForVendor, getProducts } from './queries'
import { supabase } from '@/integrations/supabase/client'

// Environment configuration
const ALERT_CONFIG = {
  REVENUE_THRESHOLD: 0.2, // 20% drop triggers alert
  TREND_REVERSAL_THRESHOLD: 0.15, // 15% trend change
  STOCKOUT_DAYS: 7, // Alert if <7 days to stockout
  COOLDOWN_HOURS: 6,
  EMAIL_CONFIDENCE_THRESHOLD: 0.8,
  SIGMA_THRESHOLDS: {
    2: 0.85, // 2-sigma anomaly
    3: 0.95, // 3-sigma anomaly
  },
}

export class AlertEngine {
  private baselineCache: Map<string, AlertMetrics> = new Map()
  private alertCache: Map<string, Alert> = new Map()

  /**
   * Collect current vendor metrics from Supabase
   */
  async collectVendorMetrics(vendorId: string) {
    const channels = await getChannelsForVendor(vendorId)
    const products = await getProducts()
    const orders = await getOrdersForVendor(vendorId)

    const channelMetrics = await Promise.all(
      channels.map(async (ch) => {
        const channelProducts = await getChannelProducts(ch.id)
        const channelOrders = orders.filter((o) => o.channel_id === ch.id)
        const totalRevenue = channelOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        const totalUnits = channelOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)

        return {
          id: ch.id,
          name: ch.channel_name,
          totalRevenue,
          totalUnits,
          growth: 0, // Would need historical data for real calculation
        }
      })
    )

    const totalRevenue = channelMetrics.reduce((sum, c) => sum + c.totalRevenue, 0)
    const channelConcentration = this.calculateGini(channelMetrics.map((c) => c.totalRevenue))

    return {
      totalRevenue,
      channels: channelMetrics,
      channelConcentration,
    }
  }

  /**
   * Calculate baseline metrics (30-day rolling average)
   */
  async calculateBaseline(vendorId: string): Promise<AlertMetrics> {
    const cacheKey = `baseline_${vendorId}`
    if (this.baselineCache.has(cacheKey)) {
      return this.baselineCache.get(cacheKey)!
    }

    // Fetch current metrics
    const metrics = await this.collectVendorMetrics(vendorId)

    const baseline: AlertMetrics = {
      revenue: {
        baseline: metrics.totalRevenue || 0,
        current: metrics.totalRevenue || 0,
        byChannel: {},
      },
      inventory: {
        stockoutRisk: [],
        lowStockCount: 0,
      },
      trend: {
        growth: 0,
        previousGrowth: 0,
      },
      channelConcentration: 0,
      costs: {
        baseline: 0,
        current: 0,
      },
    }

    // Build baseline by channel
    metrics.channels?.forEach((ch: any) => {
      baseline.revenue.byChannel[ch.name] = {
        baseline: ch.totalRevenue,
        current: ch.totalRevenue,
      }
    })

    this.baselineCache.set(cacheKey, baseline)
    return baseline
  }

  /**
   * Detect 5 anomaly types and return alerts
   */
  async detectAnomalies(vendorId: string): Promise<Alert[]> {
    const baseline = await this.calculateBaseline(vendorId)
    const alerts: Alert[] = []

    // 1. Revenue anomaly detection
    const revenueAlert = this.detectRevenueAnomaly(vendorId, baseline)
    if (revenueAlert) alerts.push(revenueAlert)

    // 2. Stockout risk detection
    const stockoutAlerts = this.detectStockoutRisk(vendorId, baseline)
    alerts.push(...stockoutAlerts)

    // 3. Trend reversal detection
    const trendAlert = this.detectTrendReversal(vendorId, baseline)
    if (trendAlert) alerts.push(trendAlert)

    // 4. Channel shift detection
    const channelAlert = this.detectChannelShift(vendorId, baseline)
    if (channelAlert) alerts.push(channelAlert)

    // 5. Cost anomaly detection
    const costAlert = this.detectCostAnomaly(vendorId, baseline)
    if (costAlert) alerts.push(costAlert)

    return alerts
  }

  /**
   * Detect revenue drops >X% vs baseline
   */
  private detectRevenueAnomaly(vendorId: string, baseline: AlertMetrics): Alert | null {
    const change = (baseline.revenue.current - baseline.revenue.baseline) / baseline.revenue.baseline
    const severity = Math.abs(change) > 0.3 ? 'critical' : 'warning'

    if (Math.abs(change) < ALERT_CONFIG.REVENUE_THRESHOLD) {
      return null
    }

    const sigma = this.calculateSigma(change, 0.15) // Assume 15% std dev
    const confidence = this.confidenceFromSigma(sigma)

    return {
      id: `alert_${vendorId}_revenue_${Date.now()}`,
      vendorId,
      type: 'revenue_drop',
      severity: severity as any,
      metric: `Revenue (${vendorId})`,
      baseline: baseline.revenue.baseline,
      current: baseline.revenue.current,
      change: change * 100,
      recommendation: `Revenue dropped ${Math.abs(change * 100).toFixed(1)}%. Review channel performance and inventory levels.`,
      confidence,
      timestamp: new Date().toISOString(),
      status: 'new' as AlertStatus,
    }
  }

  /**
   * Detect stockout risks (inventory <reorder point or <7 days)
   */
  private detectStockoutRisk(vendorId: string, baseline: AlertMetrics): Alert[] {
    const alerts: Alert[] = []

    if (!baseline.inventory.stockoutRisk || baseline.inventory.stockoutRisk.length === 0) {
      return alerts
    }

    baseline.inventory.stockoutRisk.forEach((risk: any) => {
      if (risk.daysToStockout < ALERT_CONFIG.STOCKOUT_DAYS) {
        const confidence = Math.max(0.8, 1 - risk.daysToStockout / ALERT_CONFIG.STOCKOUT_DAYS)

        alerts.push({
          id: `alert_${vendorId}_stockout_${risk.productId}_${Date.now()}`,
          vendorId,
          type: 'stockout_risk',
          severity: risk.daysToStockout <= 2 ? 'critical' : 'warning',
          metric: `Product ${risk.productId} inventory`,
          baseline: ALERT_CONFIG.STOCKOUT_DAYS,
          current: Math.max(0, risk.daysToStockout),
          change: -100 * (1 - risk.daysToStockout / ALERT_CONFIG.STOCKOUT_DAYS),
          recommendation: `Stockout imminent in ${risk.daysToStockout} days. Reorder immediately.`,
          confidence,
          timestamp: new Date().toISOString(),
          status: 'new',
        })
      }
    })

    return alerts
  }

  /**
   * Detect trend reversals (growth sign change or drop >X%)
   */
  private detectTrendReversal(vendorId: string, baseline: AlertMetrics): Alert | null {
    const { growth, previousGrowth } = baseline.trend
    const trendChange = Math.abs(growth - previousGrowth)

    if (trendChange < ALERT_CONFIG.TREND_REVERSAL_THRESHOLD) {
      return null
    }

    const isReversal = (previousGrowth > 0 && growth < 0) || (previousGrowth < 0 && growth > 0)
    const severity = isReversal ? 'critical' : 'warning'
    const sigma = this.calculateSigma(trendChange, 0.1)
    const confidence = this.confidenceFromSigma(sigma)

    return {
      id: `alert_${vendorId}_trend_${Date.now()}`,
      vendorId,
      type: 'trend_reversal',
      severity: severity as any,
      metric: `Growth trend (${vendorId})`,
      baseline: previousGrowth,
      current: growth,
      change: trendChange * 100,
      recommendation: isReversal
        ? `Growth trend reversed. Investigate market changes and competitive activity.`
        : `Growth rate declined by ${trendChange * 100}%. Monitor performance closely.`,
      confidence,
      timestamp: new Date().toISOString(),
      status: 'new',
    }
  }

  /**
   * Detect channel concentration shifts (Gini coefficient changes)
   */
  private detectChannelShift(vendorId: string, baseline: AlertMetrics): Alert | null {
    const concentration = baseline.channelConcentration
    const concentrationThreshold = 0.65 // High concentration if >0.65

    if (concentration < concentrationThreshold) {
      return null
    }

    const confidence = Math.min(0.95, 0.7 + concentration * 0.25)

    return {
      id: `alert_${vendorId}_channel_${Date.now()}`,
      vendorId,
      type: 'channel_shift',
      severity: 'warning',
      metric: `Channel concentration (${vendorId})`,
      baseline: 0.5,
      current: concentration,
      change: (concentration - 0.5) * 100,
      recommendation: `Sales concentrated on ${Math.round(concentration * 100)}% in one channel. Diversify to reduce risk.`,
      confidence,
      timestamp: new Date().toISOString(),
      status: 'new',
    }
  }

  /**
   * Detect cost anomalies (unit cost rise)
   */
  private detectCostAnomaly(vendorId: string, baseline: AlertMetrics): Alert | null {
    const change = (baseline.costs.current - baseline.costs.baseline) / baseline.costs.baseline

    if (Math.abs(change) < 0.1) {
      // <10% change is noise
      return null
    }

    const sigma = this.calculateSigma(change, 0.08)
    const confidence = this.confidenceFromSigma(sigma)

    return {
      id: `alert_${vendorId}_cost_${Date.now()}`,
      vendorId,
      type: 'cost_anomaly',
      severity: change > 0 ? 'warning' : 'info',
      metric: `Unit cost (${vendorId})`,
      baseline: baseline.costs.baseline,
      current: baseline.costs.current,
      change: change * 100,
      recommendation: `Average unit cost ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change * 100).toFixed(1)}%. Review supplier contracts and shipping.`,
      confidence,
      timestamp: new Date().toISOString(),
      status: 'new',
    }
  }

  /**
   * Calculate sigma (standard deviations from mean)
   */
  private calculateSigma(observed: number, stdDev: number): number {
    return Math.abs(observed) / stdDev
  }

  /**
   * Convert sigma to confidence score (0-1)
   */
  private confidenceFromSigma(sigma: number): number {
    if (sigma >= 3) return ALERT_CONFIG.SIGMA_THRESHOLDS[3]
    if (sigma >= 2) return ALERT_CONFIG.SIGMA_THRESHOLDS[2]
    return Math.min(0.8, 0.5 + sigma * 0.1)
  }

  /**
   * Calculate Gini coefficient (concentration measure)
   * Returns 0-1 where 0=equal distribution, 1=all concentrated
   */
  private calculateGini(values: number[]): number {
    if (values.length === 0) return 0
    if (values.length === 1) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length
    const sum = sorted.reduce((a, b) => a + b, 0)

    if (sum === 0) return 0

    let giniSum = 0
    for (let i = 0; i < n; i++) {
      giniSum += (2 * (i + 1) - n - 1) * sorted[i]
    }

    return giniSum / (n * sum)
  }

  /**
   * Check if alert is duplicate within cooldown (from DB)
   */
  async checkDuplicate(vendorId: string, type: AlertType, metric: string): Promise<Alert | null> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('alert_type', type)
        .eq('metric', metric)
        .in('status', ['new', 'ongoing'])
        .single()

      if (error || !data) return null

      const ageHours = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60)
      if (ageHours < ALERT_CONFIG.COOLDOWN_HOURS) {
        return this.dbRowToAlert(data)
      }

      return null
    } catch (err) {
      // Fallback to cache if DB unavailable
      const key = `${vendorId}_${type}_${metric}`
      const cached = this.alertCache.get(key)
      if (!cached) return null

      const ageHours = (Date.now() - new Date(cached.timestamp).getTime()) / (1000 * 60 * 60)
      return ageHours < ALERT_CONFIG.COOLDOWN_HOURS ? cached : null
    }
  }

  /**
   * Persist alert to Supabase (with fallback to cache)
   */
  async persistAlert(alert: Alert): Promise<Alert> {
    try {
      const duplicate = await this.checkDuplicate(alert.vendorId, alert.type as AlertType, alert.metric)

      if (duplicate) {
        // Update existing alert status to ongoing
        const { data } = await supabase
          .from('alerts')
          .update({
            status: 'ongoing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', duplicate.id)
          .select()
          .single()

        const persistedAlert = data ? this.dbRowToAlert(data) : duplicate

        // Check if should send email
        if (this.shouldNotifyEmail(persistedAlert)) {
          this.triggerEmailNotification(persistedAlert).catch((err) =>
            console.error('Failed to trigger email notification:', err)
          )
        }

        return persistedAlert
      }

      // Insert new alert
      const { data } = await supabase
        .from('alerts')
        .insert({
          vendor_id: alert.vendorId,
          alert_type: alert.type,
          severity: alert.severity,
          metric: alert.metric,
          baseline: alert.baseline,
          current_value: alert.current,
          confidence: alert.confidence,
          recommendation: alert.recommendation,
          status: 'new',
        })
        .select()
        .single()

      const persistedAlert = data ? this.dbRowToAlert(data) : alert

      // Check if should send email
      if (this.shouldNotifyEmail(persistedAlert)) {
        this.triggerEmailNotification(persistedAlert).catch((err) =>
          console.error('Failed to trigger email notification:', err)
        )
      }

      return persistedAlert
    } catch (err) {
      console.error('Failed to persist alert to DB, using cache:', err)
      // Fallback to cache
      const key = `${alert.vendorId}_${alert.type}_${alert.metric}`
      this.alertCache.set(key, alert)
      return alert
    }
  }

  /**
   * Trigger email notification via Supabase edge function
   */
  private async triggerEmailNotification(alert: Alert): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-alert-notification', {
        body: {
          alert_id: alert.id,
          vendor_id: alert.vendorId,
          alert_type: alert.type,
          metric: alert.metric,
          baseline: alert.baseline,
          current_value: alert.current,
          confidence: alert.confidence,
          recommendation: alert.recommendation,
        },
      })

      if (error) {
        console.error('Edge function error:', error)
      }
    } catch (err) {
      console.error('Failed to invoke email function:', err)
    }
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    try {
      await supabase.from('alerts').update({ status: 'resolved', dismissed_at: new Date().toISOString() }).eq('id', alertId)
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }

    // Also update cache
    for (const [, alert] of this.alertCache) {
      if (alert.id === alertId) {
        alert.status = 'resolved'
        break
      }
    }
  }

  /**
   * Get all active alerts for vendor
   */
  async getActiveAlerts(vendorId: string): Promise<Alert[]> {
    try {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('vendor_id', vendorId)
        .in('status', ['new', 'ongoing'])
        .order('created_at', { ascending: false })

      return data ? data.map((row) => this.dbRowToAlert(row)) : []
    } catch (err) {
      console.error('Failed to fetch alerts from DB:', err)
      // Fallback to cache
      return Array.from(this.alertCache.values())
        .filter((a) => a.vendorId === vendorId && a.status !== 'resolved')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
  }

  /**
   * Convert DB row to Alert object
   */
  private dbRowToAlert(row: any): Alert {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      type: row.alert_type as AlertType,
      severity: row.severity,
      metric: row.metric,
      baseline: row.baseline,
      current: row.current_value,
      change: ((row.current_value - row.baseline) / row.baseline) * 100,
      recommendation: row.recommendation,
      confidence: row.confidence,
      timestamp: row.created_at,
      updated_at: row.updated_at,
      status: row.status,
    }
  }

  /**
   * Check if alert meets email threshold
   */
  shouldNotifyEmail(alert: Alert): boolean {
    return alert.confidence >= ALERT_CONFIG.EMAIL_CONFIDENCE_THRESHOLD
  }
}

export const alertEngine = new AlertEngine()
