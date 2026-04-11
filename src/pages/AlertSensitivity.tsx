/**
 * Alert Sensitivity Settings Page
 *
 * Allows vendors to adjust anomaly detection thresholds per type.
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThresholdPreview } from '@/components/ThresholdPreview';
import { RecommendationCard } from '@/components/RecommendationCard';
import {
  AnomalyType,
  SENSITIVITY_DEFAULTS,
  ANOMALY_DESCRIPTIONS,
  SENSITIVITY_LABELS,
} from '@/types/alert-sensitivity';
import {
  ThresholdEngine,
  fetchVendorSensitivitySettings,
  saveVendorSensitivitySettings,
} from '@/lib/alert-sensitivity';
import {
  ThresholdRecommender,
  SensitivityRecommendation,
} from '@/lib/threshold-recommender';
import { useAuth } from '@/contexts/AuthContext';
import { alertEngine } from '@/lib/alert-engine';

const ANOMALY_TYPES: AnomalyType[] = [
  'revenue_drop',
  'stockout_risk',
  'trend_reversal',
  'channel_shift',
  'cost_anomaly',
];

export function AlertSensitivity() {
  const { user } = useAuth();
  const vendorId = user?.id || '';

  const [thresholds, setThresholds] = useState<Record<AnomalyType, number>>(
    ThresholdEngine.getSensitivityDefaults()
  );
  const [newThresholds, setNewThresholds] = useState<Record<
    AnomalyType,
    number
  > | null>(null);
  const [recommendations, setRecommendations] = useState<
    SensitivityRecommendation[]
  >([]);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<
    Set<AnomalyType>
  >(new Set());

  // Load alerts for preview
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', vendorId],
    queryFn: () =>
      vendorId ? alertEngine.getActiveAlerts(vendorId) : Promise.resolve([]),
    enabled: !!vendorId,
  });

  // Load current settings
  const { isLoading: settingsLoading } = useQuery({
    queryKey: ['alertSensitivity', vendorId],
    queryFn: () =>
      vendorId
        ? fetchVendorSensitivitySettings(vendorId)
        : Promise.resolve(ThresholdEngine.getSensitivityDefaults()),
    enabled: !!vendorId,
    onSuccess: (data) => {
      setThresholds(data);
      setNewThresholds(null);
    },
  });

  // Load recommendations
  const { isLoading: recommendationsLoading } = useQuery({
    queryKey: ['alertRecommendations', vendorId],
    queryFn: () =>
      vendorId
        ? ThresholdRecommender.getRecommendations(vendorId, thresholds)
        : Promise.resolve([]),
    enabled: !!vendorId && Object.keys(thresholds).length > 0,
    onSuccess: (data) => {
      setRecommendations(data);
    },
  });

  const isLoading = settingsLoading || alertsLoading || recommendationsLoading;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (newSettings: Record<AnomalyType, number>) =>
      vendorId
        ? saveVendorSensitivitySettings(vendorId, newSettings)
        : Promise.reject(new Error('No vendor selected')),
    onSuccess: () => {
      setThresholds(newThresholds!);
      setNewThresholds(null);
    },
  });

  const handleSliderChange = (anomalyType: AnomalyType, value: number[]) => {
    const updated = { ...thresholds, [anomalyType]: value[0] };
    setNewThresholds(updated);
  };

  const handleSave = async () => {
    if (newThresholds) {
      await saveMutation.mutateAsync(newThresholds);
    }
  };

  const handleCancel = () => {
    setNewThresholds(null);
  };

  const handleApplyRecommendation = async (
    recommendation: SensitivityRecommendation
  ) => {
    const updated = { ...thresholds, [recommendation.anomaly_type]: recommendation.recommended_threshold };
    setNewThresholds(updated);

    // Save recommendation history
    try {
      await ThresholdRecommender.saveRecommendation(vendorId, recommendation);
    } catch (error) {
      console.error('Failed to save recommendation:', error);
    }
  };

  const handleDismissRecommendation = (anomalyType: AnomalyType) => {
    setDismissedRecommendations(new Set([...dismissedRecommendations, anomalyType]));
  };

  const currentSettings = newThresholds || thresholds;
  const hasChanges = newThresholds !== null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading sensitivity settings...</p>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Please log in to manage alert sensitivity settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Alert Sensitivity Settings</h1>
        <p className="mt-2 text-gray-600">
          Adjust anomaly detection thresholds to reduce false positives. Lower
          numbers show more alerts; higher numbers are more strict.
        </p>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">AI-Powered Recommendations</h2>
          <p className="text-sm text-gray-600">
            Based on your alert history, here are suggested adjustments to reduce false positives.
          </p>
          {recommendations
            .filter((rec) => !dismissedRecommendations.has(rec.anomaly_type))
            .map((rec) => (
              <RecommendationCard
                key={rec.anomaly_type}
                recommendation={rec}
                onApply={handleApplyRecommendation}
                onDismiss={handleDismissRecommendation}
                isApplying={saveMutation.isPending}
              />
            ))}
        </div>
      )}

      {/* Sensitivity Sliders */}
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
        {ANOMALY_TYPES.map((anomalyType) => {
          const currentValue = currentSettings[anomalyType];
          const defaultValue = thresholds[anomalyType];

          return (
            <div key={anomalyType} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {ANOMALY_DESCRIPTIONS[anomalyType]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Current: {SENSITIVITY_LABELS[currentValue]}
                  </p>
                </div>
                <div className="flex gap-2">
                  {hasChanges && currentValue !== defaultValue && (
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Changed
                    </span>
                  )}
                  <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    Level {currentValue}/10
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">More Alerts</span>
                <Slider
                  value={[currentValue]}
                  onValueChange={(value) =>
                    handleSliderChange(anomalyType, value)
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500">Fewer Alerts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview */}
      {hasChanges && (
        <ThresholdPreview
          alerts={alerts}
          currentThresholds={thresholds}
          newThresholds={newThresholds!}
        />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={!hasChanges}
          variant="outline"
        >
          Cancel
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✓ Sensitivity settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
