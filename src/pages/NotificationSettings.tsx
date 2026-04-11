import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { reportEngine } from '@/lib/report-engine'
import { notificationChannels } from '@/lib/notification-channels'
import { getCurrentVendor } from '@/lib/queries'
import ReportDialog from '@/components/ReportDialog'
import type { ReportType, ReportPreference, ReportChannel } from '@/types/reports'

export default function NotificationSettings() {
  const [showDailyPreview, setShowDailyPreview] = useState(false)
  const [showWeeklyPreview, setShowWeeklyPreview] = useState(false)
  const [dailyPhoneError, setDailyPhoneError] = useState('')
  const [weeklyPhoneError, setWeeklyPhoneError] = useState('')
  const [sendingTestReport, setSendingTestReport] = useState<ReportType | null>(null)

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['current-vendor'],
    queryFn: getCurrentVendor,
    staleTime: 1000 * 60 * 5,
  })

  const { data: dailyPreference, isLoading: dailyLoading, refetch: refetchDaily } = useQuery({
    queryKey: ['report-preference', 'daily', vendor?.vendor_id],
    queryFn: () => (vendor?.vendor_id ? reportEngine.getReportPreference(vendor.vendor_id, 'daily') : null),
    enabled: !!vendor?.vendor_id,
  })

  const { data: weeklyPreference, isLoading: weeklyLoading, refetch: refetchWeekly } = useQuery({
    queryKey: ['report-preference', 'weekly', vendor?.vendor_id],
    queryFn: () => (vendor?.vendor_id ? reportEngine.getReportPreference(vendor.vendor_id, 'weekly') : null),
    enabled: !!vendor?.vendor_id,
  })

  const [dailySettings, setDailySettings] = useState<Partial<ReportPreference>>({
    reportType: 'daily',
    enabled: false,
    channels: ['email'],
  })

  const [weeklySettings, setWeeklySettings] = useState<Partial<ReportPreference>>({
    reportType: 'weekly',
    enabled: false,
    channels: ['email'],
  })

  useEffect(() => {
    if (dailyPreference) {
      setDailySettings(dailyPreference)
    }
  }, [dailyPreference])

  useEffect(() => {
    if (weeklyPreference) {
      setWeeklySettings(weeklyPreference)
    }
  }, [weeklyPreference])

  const saveDailyMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.vendor_id) return null
      return reportEngine.saveReportPreference({
        vendorId: vendor.vendor_id,
        reportType: 'daily',
        enabled: dailySettings.enabled || false,
        channels: dailySettings.channels as ReportChannel[],
        smsPhone: dailySettings.smsPhone,
        slackWebhookUrl: dailySettings.slackWebhookUrl,
      })
    },
    onSuccess: () => {
      refetchDaily()
    },
  })

  const saveWeeklyMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.vendor_id) return null
      return reportEngine.saveReportPreference({
        vendorId: vendor.vendor_id,
        reportType: 'weekly',
        enabled: weeklySettings.enabled || false,
        channels: weeklySettings.channels as ReportChannel[],
        smsPhone: weeklySettings.smsPhone,
        slackWebhookUrl: weeklySettings.slackWebhookUrl,
      })
    },
    onSuccess: () => {
      refetchWeekly()
    },
  })

  const handleSendTestReport = async (reportType: ReportType) => {
    if (!vendor?.vendor_id) return

    setSendingTestReport(reportType)
    try {
      const report = reportType === 'daily'
        ? await reportEngine.generateDailyReport(vendor.vendor_id)
        : await reportEngine.generateWeeklyReport(vendor.vendor_id)

      if (report) {
        const channels = reportType === 'daily'
          ? (dailySettings.channels as ReportChannel[])
          : (weeklySettings.channels as ReportChannel[])

        await notificationChannels.sendReportViaChannels(report, channels)
      }
    } catch (err) {
      console.error('Test report error:', err)
    } finally {
      setSendingTestReport(null)
    }
  }

  const handlePhoneChange = (value: string, type: ReportType) => {
    if (type === 'daily') {
      setDailySettings({ ...dailySettings, smsPhone: value })
      setDailyPhoneError('')
    } else {
      setWeeklySettings({ ...weeklySettings, smsPhone: value })
      setWeeklyPhoneError('')
    }
  }

  const validatePhoneNumber = async (phone: string, type: ReportType) => {
    const isValid = await notificationChannels.validatePhoneNumber(phone)
    if (!isValid) {
      if (type === 'daily') {
        setDailyPhoneError('Invalid phone format. Use E.164 format (e.g., +1-555-0123)')
      } else {
        setWeeklyPhoneError('Invalid phone format. Use E.164 format (e.g., +1-555-0123)')
      }
    }
  }

  if (vendorLoading || dailyLoading || weeklyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-1">Configure how you receive reports and insights</p>
      </div>

      {/* Daily Reports */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daily Reports</CardTitle>
          <CardDescription>Sent every day at 9 AM UTC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="daily-enabled"
              checked={dailySettings.enabled || false}
              onChange={(e) => setDailySettings({ ...dailySettings, enabled: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300"
            />
            <label htmlFor="daily-enabled" className="text-sm font-medium text-gray-900">
              Enable daily reports
            </label>
          </div>

          {dailySettings.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Delivery Channels</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="daily-email"
                      checked={dailySettings.channels?.includes('email') || false}
                      disabled
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="daily-email" className="text-sm text-gray-700">
                      Email (always enabled)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="daily-sms"
                      checked={dailySettings.channels?.includes('sms') || false}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...(dailySettings.channels || []), 'sms']
                          : (dailySettings.channels || []).filter((c) => c !== 'sms')
                        setDailySettings({ ...dailySettings, channels })
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="daily-sms" className="text-sm text-gray-700">
                      SMS (Twilio)
                    </label>
                  </div>

                  {dailySettings.channels?.includes('sms') && (
                    <div className="ml-6 mt-2">
                      <input
                        type="tel"
                        placeholder="+1-555-0123"
                        value={dailySettings.smsPhone || ''}
                        onChange={(e) => handlePhoneChange(e.target.value, 'daily')}
                        onBlur={(e) => e.target.value && validatePhoneNumber(e.target.value, 'daily')}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      {dailyPhoneError && <p className="text-red-600 text-xs mt-1">{dailyPhoneError}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="daily-slack"
                      checked={dailySettings.channels?.includes('slack') || false}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...(dailySettings.channels || []), 'slack']
                          : (dailySettings.channels || []).filter((c) => c !== 'slack')
                        setDailySettings({ ...dailySettings, channels })
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="daily-slack" className="text-sm text-gray-700">
                      Slack Webhook
                    </label>
                  </div>

                  {dailySettings.channels?.includes('slack') && (
                    <div className="ml-6 mt-2">
                      <input
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={dailySettings.slackWebhookUrl || ''}
                        onChange={(e) => setDailySettings({ ...dailySettings, slackWebhookUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  onClick={() => saveDailyMutation.mutate()}
                  disabled={saveDailyMutation.isPending}
                  className="flex-1"
                >
                  {saveDailyMutation.isPending ? 'Saving...' : 'Save Daily Settings'}
                </Button>
                <Button
                  onClick={() => setShowDailyPreview(true)}
                  variant="outline"
                >
                  Preview
                </Button>
                <Button
                  onClick={() => handleSendTestReport('daily')}
                  disabled={sendingTestReport === 'daily'}
                  variant="outline"
                  size="sm"
                >
                  {sendingTestReport === 'daily' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Reports</CardTitle>
          <CardDescription>Sent every Monday at 6 AM UTC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="weekly-enabled"
              checked={weeklySettings.enabled || false}
              onChange={(e) => setWeeklySettings({ ...weeklySettings, enabled: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300"
            />
            <label htmlFor="weekly-enabled" className="text-sm font-medium text-gray-900">
              Enable weekly reports
            </label>
          </div>

          {weeklySettings.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 mb-3">Delivery Channels</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="weekly-email"
                      checked={weeklySettings.channels?.includes('email') || false}
                      disabled
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="weekly-email" className="text-sm text-gray-700">
                      Email (always enabled)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="weekly-sms"
                      checked={weeklySettings.channels?.includes('sms') || false}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...(weeklySettings.channels || []), 'sms']
                          : (weeklySettings.channels || []).filter((c) => c !== 'sms')
                        setWeeklySettings({ ...weeklySettings, channels })
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="weekly-sms" className="text-sm text-gray-700">
                      SMS (Twilio)
                    </label>
                  </div>

                  {weeklySettings.channels?.includes('sms') && (
                    <div className="ml-6 mt-2">
                      <input
                        type="tel"
                        placeholder="+1-555-0123"
                        value={weeklySettings.smsPhone || ''}
                        onChange={(e) => handlePhoneChange(e.target.value, 'weekly')}
                        onBlur={(e) => e.target.value && validatePhoneNumber(e.target.value, 'weekly')}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      {weeklyPhoneError && <p className="text-red-600 text-xs mt-1">{weeklyPhoneError}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="weekly-slack"
                      checked={weeklySettings.channels?.includes('slack') || false}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...(weeklySettings.channels || []), 'slack']
                          : (weeklySettings.channels || []).filter((c) => c !== 'slack')
                        setWeeklySettings({ ...weeklySettings, channels })
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="weekly-slack" className="text-sm text-gray-700">
                      Slack Webhook
                    </label>
                  </div>

                  {weeklySettings.channels?.includes('slack') && (
                    <div className="ml-6 mt-2">
                      <input
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={weeklySettings.slackWebhookUrl || ''}
                        onChange={(e) => setWeeklySettings({ ...weeklySettings, slackWebhookUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  onClick={() => saveWeeklyMutation.mutate()}
                  disabled={saveWeeklyMutation.isPending}
                  className="flex-1"
                >
                  {saveWeeklyMutation.isPending ? 'Saving...' : 'Save Weekly Settings'}
                </Button>
                <Button
                  onClick={() => setShowWeeklyPreview(true)}
                  variant="outline"
                >
                  Preview
                </Button>
                <Button
                  onClick={() => handleSendTestReport('weekly')}
                  disabled={sendingTestReport === 'weekly'}
                  variant="outline"
                  size="sm"
                >
                  {sendingTestReport === 'weekly' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialogs */}
      {showDailyPreview && <ReportDialog reportType="daily" onClose={() => setShowDailyPreview(false)} />}
      {showWeeklyPreview && <ReportDialog reportType="weekly" onClose={() => setShowWeeklyPreview(false)} />}
    </div>
  )
}
