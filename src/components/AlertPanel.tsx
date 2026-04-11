import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Alert } from '@/types/alerts'
import { alertEngine } from '@/lib/alert-engine'
import { ThresholdEngine, fetchVendorSensitivitySettings } from '@/lib/alert-sensitivity'

interface AlertPanelProps {
  vendorId: string
  refetchTrigger?: number
}

export default function AlertPanel({ vendorId, refetchTrigger }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch active alerts
  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const activeAlerts = await alertEngine.getActiveAlerts(vendorId)

      // Load vendor sensitivity settings
      const thresholds = await fetchVendorSensitivitySettings(vendorId)

      // Apply sensitivity filtering
      const filtered = ThresholdEngine.applySensitivity(activeAlerts, thresholds)

      setAlerts(activeAlerts)
      setFilteredAlerts(filtered)
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setAlerts([])
      setFilteredAlerts([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and on refetch trigger
  useEffect(() => {
    fetchAlerts()
  }, [vendorId, refetchTrigger])

  // Poll for new alerts every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [vendorId])

  const handleDismiss = async (alertId: string) => {
    await alertEngine.dismissAlert(alertId)
    setAlerts(alerts.filter((a) => a.id !== alertId))
  }

  if (loading || filteredAlerts.length === 0) {
    return null
  }

  const hiddenAlertCount = alerts.length - filteredAlerts.length

  return (
    <div className="mb-8 space-y-3">
      {hiddenAlertCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <span className="font-medium">{hiddenAlertCount} alert(s) hidden</span> by your sensitivity settings. <a href="/alert-sensitivity" className="underline hover:no-underline">Adjust settings</a>
        </div>
      )}
      {filteredAlerts.map((alert) => (
        <Card
          key={alert.id}
          className={`border-l-4 ${
            alert.severity === 'critical'
              ? 'border-l-red-600 bg-red-50'
              : alert.severity === 'warning'
                ? 'border-l-orange-600 bg-orange-50'
                : 'border-l-blue-600 bg-blue-50'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {/* Icon */}
                {alert.severity === 'critical' && (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                {alert.severity === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                )}
                {alert.severity === 'info' && (
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Alert type and metric */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {alert.type.replace(/_/g, ' ').charAt(0).toUpperCase() +
                        alert.type.replace(/_/g, ' ').slice(1)}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50">
                      {alert.severity === 'critical' ? '🔴 Critical' : alert.severity === 'warning' ? '🟠 Warning' : '🔵 Info'}
                    </span>
                  </div>

                  {/* Metric comparison */}
                  <p className="text-sm text-gray-700 mb-2">{alert.metric}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span>
                      Current: <span className="font-mono font-semibold">{alert.current.toFixed(2)}</span>
                    </span>
                    <span>vs Baseline:</span>
                    <span>
                      <span className="font-mono font-semibold">{alert.baseline.toFixed(2)}</span>
                    </span>
                    <span className={`font-semibold ${alert.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {alert.change > 0 ? '+' : ''}{alert.change.toFixed(1)}%
                    </span>
                  </div>

                  {/* Recommendation */}
                  <p className="text-sm text-gray-700">{alert.recommendation}</p>

                  {/* Confidence score */}
                  <div className="mt-2 text-xs text-gray-500">
                    Confidence: {(alert.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(alert.id)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white hover:bg-opacity-50 rounded transition-colors flex-shrink-0"
                title="Dismiss alert"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
