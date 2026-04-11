/**
 * Threshold Preview Component
 *
 * Shows filtered alert samples and impact metrics before committing sensitivity changes.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert as AlertType } from '@/types/alerts';
import { AnomalyType } from '@/types/alert-sensitivity';
import { ThresholdEngine } from '@/lib/alert-sensitivity';
import { ANOMALY_DESCRIPTIONS } from '@/types/alert-sensitivity';

interface ThresholdPreviewProps {
  alerts: AlertType[];
  currentThresholds: Record<AnomalyType, number>;
  newThresholds: Record<AnomalyType, number>;
}

export function ThresholdPreview({
  alerts,
  currentThresholds,
  newThresholds,
}: ThresholdPreviewProps) {
  // Filter alerts with current vs new thresholds
  const currentFiltered = ThresholdEngine.applySensitivity(
    alerts,
    currentThresholds
  );
  const newFiltered = ThresholdEngine.applySensitivity(alerts, newThresholds);

  // Calculate impact
  const hiddenCount = currentFiltered.length - newFiltered.length;
  const impactPercent =
    currentFiltered.length > 0
      ? Math.round((hiddenCount / currentFiltered.length) * 100)
      : 0;

  // Get sample alerts that will be hidden
  const hiddenAlerts = currentFiltered.filter(
    (alert) =>
      !newFiltered.some(
        (newAlert) =>
          newAlert.id === alert.id &&
          newAlert.alert_type === alert.alert_type
      )
  );

  const sampleHiddenAlerts = hiddenAlerts.slice(0, 3);

  return (
    <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-amber-900">Preview Changes</h3>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded bg-white p-3">
          <div className="text-xs text-gray-600">Current Alerts</div>
          <div className="text-2xl font-bold text-gray-900">
            {currentFiltered.length}
          </div>
        </div>
        <div className="rounded bg-white p-3">
          <div className="text-xs text-gray-600">After Change</div>
          <div className="text-2xl font-bold text-gray-900">
            {newFiltered.length}
          </div>
        </div>
      </div>

      {hiddenCount > 0 && (
        <div className="rounded bg-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-gray-700">
              {hiddenCount} alerts will be hidden ({impactPercent}%)
            </span>
          </div>

          {sampleHiddenAlerts.length > 0 && (
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <p className="text-xs font-medium text-gray-600">
                Examples of hidden alerts:
              </p>
              {sampleHiddenAlerts.map((alert) => (
                <div
                  key={`${alert.id}-${alert.type}`}
                  className="rounded border border-gray-200 bg-gray-50 p-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {ANOMALY_DESCRIPTIONS[alert.type as AnomalyType] ||
                          alert.type}
                      </p>
                      <p className="mt-1 text-gray-600">
                        {alert.metric}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-gray-500">
                      {Math.abs(alert.change).toFixed(1)}% change
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {hiddenCount === 0 && (
        <div className="rounded bg-green-50 p-3">
          <p className="text-sm text-green-700">
            ✓ No change in visible alerts with new settings.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-600">
        Review the changes above before saving. You can always adjust settings
        later.
      </p>
    </div>
  );
}
