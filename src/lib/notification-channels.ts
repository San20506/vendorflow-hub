import { supabase } from './supabase'
import { reportEngine } from './report-engine'
import type { Report, ReportChannel, ReportHistory } from '@/types/reports'

interface SendResult {
  channel: ReportChannel
  success: boolean
  messageId?: string
  error?: string
}

class NotificationChannels {
  async sendReportViaChannels(report: Report, channels: ReportChannel[]): Promise<SendResult[]> {
    const results: SendResult[] = []

    // Email is required
    const emailResult = await this.sendViaEmail(report)
    results.push(emailResult)

    // Optional channels
    if (channels.includes('sms')) {
      const smsResult = await this.sendViaSMS(report)
      results.push(smsResult)
    }

    if (channels.includes('slack')) {
      const slackResult = await this.sendViaSlack(report)
      results.push(slackResult)
    }

    // Log execution
    const successChannels = results.filter((r) => r.success).map((r) => r.channel)
    await reportEngine.logReportExecution({
      vendorId: report.vendorId,
      reportType: report.reportType,
      generatedAt: report.generatedAt,
      sentAt: new Date().toISOString(),
      channelsSent: successChannels,
      status: successChannels.length > 0 ? 'success' : 'failed',
      errorMessage: results.filter((r) => !r.success).map((r) => `${r.channel}: ${r.error}`).join('; '),
    })

    return results
  }

  private async sendViaEmail(report: Report): Promise<SendResult> {
    try {
      // Fetch vendor email
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('email, name')
        .eq('id', report.vendorId)
        .single()

      if (vendorError || !vendor?.email) {
        console.error('Vendor not found:', vendorError)
        return {
          channel: 'email',
          success: false,
          error: 'Vendor email not found',
        }
      }

      // Format report as HTML
      const htmlContent = reportEngine.formatAsHTML(report)
      const reportType = report.reportType === 'daily' ? 'Daily' : 'Weekly'

      // Call edge function (fire-and-forget with error logging)
      supabase.functions
        .invoke('send-email-report', {
          body: {
            to: vendor.email,
            subject: `${reportType} Insights Report - ${new Date(report.generatedAt).toLocaleDateString()}`,
            html: htmlContent,
            vendorName: vendor.name,
          },
        })
        .catch((err) => {
          console.error('Email send function error:', err)
        })

      return {
        channel: 'email',
        success: true,
        messageId: report.id,
      }
    } catch (err) {
      console.error('Email send error:', err)
      return {
        channel: 'email',
        success: false,
        error: String(err),
      }
    }
  }

  private async sendViaSMS(report: Report): Promise<SendResult> {
    try {
      // Get vendor SMS preference
      const preference = await reportEngine.getReportPreference(report.vendorId, report.reportType)

      if (!preference?.smsPhone) {
        return {
          channel: 'sms',
          success: false,
          error: 'SMS phone not configured',
        }
      }

      // Format report as text
      const textContent = reportEngine.formatAsText(report)
      const truncated = textContent.substring(0, 480) // SMS length limit

      // Call edge function (fire-and-forget)
      supabase.functions
        .invoke('send-sms-report', {
          body: {
            phoneNumber: preference.smsPhone,
            message: truncated,
          },
        })
        .catch((err) => {
          console.error('SMS send function error:', err)
        })

      return {
        channel: 'sms',
        success: true,
        messageId: report.id,
      }
    } catch (err) {
      console.error('SMS send error:', err)
      return {
        channel: 'sms',
        success: false,
        error: String(err),
      }
    }
  }

  private async sendViaSlack(report: Report): Promise<SendResult> {
    try {
      // Get vendor Slack preference
      const preference = await reportEngine.getReportPreference(report.vendorId, report.reportType)

      if (!preference?.slackWebhookUrl) {
        return {
          channel: 'slack',
          success: false,
          error: 'Slack webhook not configured',
        }
      }

      // Validate webhook URL
      if (!preference.slackWebhookUrl.startsWith('https://hooks.slack.com')) {
        return {
          channel: 'slack',
          success: false,
          error: 'Invalid Slack webhook URL',
        }
      }

      // Format report for Slack
      const slackPayload = reportEngine.formatAsSlack(report)

      // Call edge function (fire-and-forget)
      supabase.functions
        .invoke('send-slack-report', {
          body: {
            webhookUrl: preference.slackWebhookUrl,
            payload: slackPayload,
          },
        })
        .catch((err) => {
          console.error('Slack send function error:', err)
        })

      return {
        channel: 'slack',
        success: true,
        messageId: report.id,
      }
    } catch (err) {
      console.error('Slack send error:', err)
      return {
        channel: 'slack',
        success: false,
        error: String(err),
      }
    }
  }

  async validateSlackWebhook(webhookUrl: string): Promise<boolean> {
    try {
      if (!webhookUrl.startsWith('https://hooks.slack.com')) {
        return false
      }

      // Call edge function to test webhook
      const result = await supabase.functions.invoke('validate-slack-webhook', {
        body: { webhookUrl },
      })

      return result.data?.valid === true
    } catch (err) {
      console.error('Slack webhook validation error:', err)
      return false
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    // Basic E.164 validation
    const e164Regex = /^\+?[1-9]\d{1,14}$/
    return e164Regex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))
  }
}

export const notificationChannels = new NotificationChannels()
