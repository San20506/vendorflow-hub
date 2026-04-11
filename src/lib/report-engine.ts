import { supabase } from './supabase'
import { alertEngine } from './alert-engine'
import { insightEngine } from './insight-engine'
import type { Report, ReportFormat, ReportPreference, ReportHistory, ReportType } from '@/types/reports'

class ReportEngine {
  private static instance: ReportEngine

  private constructor() {}

  static getInstance(): ReportEngine {
    if (!ReportEngine.instance) {
      ReportEngine.instance = new ReportEngine()
    }
    return ReportEngine.instance
  }

  async generateDailyReport(vendorId: string): Promise<Report | null> {
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 1)

      return this.generateReport(vendorId, 'daily', cutoff)
    } catch (err) {
      console.error('Daily report generation error:', err)
      return null
    }
  }

  async generateWeeklyReport(vendorId: string): Promise<Report | null> {
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)

      return this.generateReport(vendorId, 'weekly', cutoff)
    } catch (err) {
      console.error('Weekly report generation error:', err)
      return null
    }
  }

  private async generateReport(vendorId: string, reportType: ReportType, cutoffDate: Date): Promise<Report | null> {
    try {
      // Fetch alerts from history
      const { data: alertHistory, error: alertError } = await supabase
        .from('alert_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('timestamp', cutoffDate.toISOString())

      if (alertError) {
        console.error('Error fetching alert history:', alertError)
        return null
      }

      // Count alerts by status
      const alertSummary = {
        total: alertHistory?.length || 0,
        critical: alertHistory?.filter((a) => a.new_status === 'critical').length || 0,
        warning: alertHistory?.filter((a) => a.new_status === 'warning').length || 0,
        info: alertHistory?.filter((a) => a.new_status === 'info').length || 0,
      }

      // Fetch active alerts for recommendations
      const activeAlerts = await alertEngine.getActiveAlerts(vendorId)

      // Generate recommendations from alerts
      const topRecommendations = activeAlerts
        .filter((a) => a.confidence >= 0.7)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .map((a) => ({
          title: `${a.type.replace(/_/g, ' ')} Alert`,
          description: a.recommendation,
          impact: a.severity === 'critical' ? 'high' : a.severity === 'warning' ? 'medium' : 'low',
          confidence: a.confidence,
          action: `Review ${a.metric} metrics in dashboard`,
        }))

      // Fetch key metrics (stub - would extend with actual metrics)
      const keyMetrics = {
        revenue: {
          current: 0,
          previous: 0,
          change: 0,
        },
        inventory: {
          stockedProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
        },
        channels: [],
      }

      // Fetch insights
      const insights = (
        await insightEngine.generateAllInsights(vendorId).catch(() => [])
      ).slice(0, 5).map((i) => ({
        title: i.title,
        description: i.description,
        confidence: i.confidence,
      }))

      const report: Report = {
        id: crypto.randomUUID(),
        vendorId,
        reportType,
        generatedAt: new Date().toISOString(),
        alertSummary,
        topRecommendations,
        keyMetrics,
        insights,
      }

      return report
    } catch (err) {
      console.error('Report generation error:', err)
      return null
    }
  }

  formatAsHTML(report: Report): string {
    const { alertSummary, topRecommendations, keyMetrics, insights } = report
    const reportType = report.reportType === 'daily' ? 'Daily' : 'Weekly'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6b21a8; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { margin: 20px 0; background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #6b21a8; }
    .metric { display: flex; justify-content: space-between; padding: 8px 0; }
    .metric-label { font-weight: bold; }
    .metric-value { color: #666; }
    .recommendation { background-color: #fef2f2; padding: 10px; margin: 10px 0; border-radius: 4px; }
    .insight { background-color: #f0f9ff; padding: 10px; margin: 10px 0; border-radius: 4px; }
    .button { display: inline-block; background-color: #6b21a8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${reportType} Insights Report</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Generated ${new Date(report.generatedAt).toLocaleDateString()}</p>
    </div>
    <div class="content">
      <div class="section">
        <h2 style="margin-top: 0;">Alert Summary</h2>
        <div class="metric">
          <span class="metric-label">Total Alerts:</span>
          <span class="metric-value">${alertSummary.total}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Critical:</span>
          <span class="metric-value">${alertSummary.critical}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Warnings:</span>
          <span class="metric-value">${alertSummary.warning}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Info:</span>
          <span class="metric-value">${alertSummary.info}</span>
        </div>
      </div>

      <div class="section">
        <h2 style="margin-top: 0;">Top Recommendations</h2>
        ${topRecommendations.map((r) => `
          <div class="recommendation">
            <strong>${r.title}</strong><br>
            ${r.description}<br>
            <small style="color: #666;">Confidence: ${(r.confidence * 100).toFixed(0)}%</small>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2 style="margin-top: 0;">Key Insights</h2>
        ${insights.map((i) => `
          <div class="insight">
            <strong>${i.title}</strong><br>
            ${i.description}
          </div>
        `).join('')}
      </div>

      <p style="text-align: center;">
        <a href="https://app.vendorflow-hub.com/insights" class="button">View Full Dashboard</a>
      </p>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        You can manage your report preferences in Account Settings → Notifications.
      </p>
    </div>
    <div class="footer">
      <p>VendorFlow Hub • ${reportType} Report sent at ${new Date(report.generatedAt).toISOString()}</p>
    </div>
  </div>
</body>
</html>
    `
  }

  formatAsText(report: Report): string {
    const { alertSummary, topRecommendations, insights } = report
    const reportType = report.reportType === 'daily' ? 'Daily' : 'Weekly'

    let text = `${reportType} Insights Report\n`
    text += `Generated: ${new Date(report.generatedAt).toLocaleDateString()}\n\n`

    text += `ALERT SUMMARY\n`
    text += `Total Alerts: ${alertSummary.total}\n`
    text += `Critical: ${alertSummary.critical} | Warnings: ${alertSummary.warning} | Info: ${alertSummary.info}\n\n`

    text += `TOP RECOMMENDATIONS\n`
    topRecommendations.forEach((r, i) => {
      text += `${i + 1}. ${r.title}\n${r.description}\n`
    })

    text += `\nKEY INSIGHTS\n`
    insights.forEach((i, idx) => {
      text += `${idx + 1}. ${i.title}\n`
    })

    text += `\nView full dashboard: https://app.vendorflow-hub.com/insights\n`

    return text
  }

  formatAsSlack(report: Report): Record<string, any> {
    const { alertSummary, topRecommendations } = report
    const reportType = report.reportType === 'daily' ? 'Daily' : 'Weekly'

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 ${reportType} Insights Report`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Alerts:*\n${alertSummary.total}`,
            },
            {
              type: 'mrkdwn',
              text: `*Critical:*\n${alertSummary.critical}`,
            },
            {
              type: 'mrkdwn',
              text: `*Warnings:*\n${alertSummary.warning}`,
            },
            {
              type: 'mrkdwn',
              text: `*Info:*\n${alertSummary.info}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Top Recommendations*\n${topRecommendations
              .slice(0, 3)
              .map((r) => `• ${r.title}: ${r.description.substring(0, 50)}...`)
              .join('\n')}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard',
              },
              url: 'https://app.vendorflow-hub.com/insights',
            },
          ],
        },
      ],
    }
  }

  async getReportPreference(vendorId: string, reportType: ReportType): Promise<ReportPreference | null> {
    try {
      const { data, error } = await supabase
        .from('report_preferences')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('report_type', reportType)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching report preference:', error)
      }
      return data || null
    } catch (err) {
      console.error('Report preference fetch error:', err)
      return null
    }
  }

  async saveReportPreference(preference: Omit<ReportPreference, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportPreference | null> {
    try {
      const existing = await this.getReportPreference(preference.vendorId, preference.reportType)

      if (existing) {
        const { data, error } = await supabase
          .from('report_preferences')
          .update({
            enabled: preference.enabled,
            channels: preference.channels,
            sms_phone: preference.smsPhone,
            slack_webhook_url: preference.slackWebhookUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating report preference:', error)
          return null
        }
        return data
      } else {
        const { data, error } = await supabase
          .from('report_preferences')
          .insert({
            vendor_id: preference.vendorId,
            report_type: preference.reportType,
            enabled: preference.enabled,
            channels: preference.channels,
            sms_phone: preference.smsPhone,
            slack_webhook_url: preference.slackWebhookUrl,
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating report preference:', error)
          return null
        }
        return data
      }
    } catch (err) {
      console.error('Report preference save error:', err)
      return null
    }
  }

  async logReportExecution(history: Omit<ReportHistory, 'id'>): Promise<ReportHistory | null> {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .insert({
          vendor_id: history.vendorId,
          report_type: history.reportType,
          generated_at: history.generatedAt,
          sent_at: history.sentAt || new Date().toISOString(),
          channels_sent: history.channelsSent,
          status: history.status,
          error_message: history.errorMessage,
        })
        .select()
        .single()

      if (error) {
        console.error('Error logging report execution:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Report history logging error:', err)
      return null
    }
  }
}

export const reportEngine = ReportEngine.getInstance()
