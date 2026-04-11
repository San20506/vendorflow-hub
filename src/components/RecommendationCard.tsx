/**
 * Recommendation Card Component
 *
 * Displays AI-generated threshold recommendations with reasoning and apply button.
 */

import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SensitivityRecommendation } from '@/lib/threshold-recommender';
import { ANOMALY_DESCRIPTIONS, SENSITIVITY_LABELS } from '@/types/alert-sensitivity';

interface RecommendationCardProps {
  recommendation: SensitivityRecommendation;
  onApply: (recommendation: SensitivityRecommendation) => void;
  onDismiss?: (anomalyType: string) => void;
  isApplying?: boolean;
}

export function RecommendationCard({
  recommendation,
  onApply,
  onDismiss,
  isApplying = false,
}: RecommendationCardProps) {
  const isIncrease =
    recommendation.recommended_threshold > recommendation.current_threshold;

  const confidenceColor =
    recommendation.confidence_score >= 0.75
      ? 'text-green-600'
      : recommendation.confidence_score >= 0.5
        ? 'text-amber-600'
        : 'text-gray-600';

  const confidenceLabel =
    recommendation.confidence_score >= 0.75
      ? 'High'
      : recommendation.confidence_score >= 0.5
        ? 'Medium'
        : 'Low';

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-blue-900">
            Recommendation for {ANOMALY_DESCRIPTIONS[recommendation.anomaly_type]}
          </h3>
          <p className="mt-1 text-sm text-blue-700">{recommendation.reasoning}</p>
        </div>
      </div>

      {/* Current vs Recommended Comparison */}
      <div className="mb-4 flex items-center gap-3 rounded bg-white p-3">
        <div className="flex-1">
          <p className="text-xs text-gray-600">Current Setting</p>
          <p className="text-lg font-bold text-gray-900">
            {recommendation.current_threshold}/10
          </p>
          <p className="text-xs text-gray-500">
            {SENSITIVITY_LABELS[recommendation.current_threshold]}
          </p>
        </div>

        <div className="text-gray-400">
          {isIncrease ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1">
          <p className="text-xs text-gray-600">Recommended</p>
          <p className="text-lg font-bold text-blue-600">
            {recommendation.recommended_threshold}/10
          </p>
          <p className="text-xs text-blue-600">
            {SENSITIVITY_LABELS[recommendation.recommended_threshold]}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-4 grid grid-cols-3 gap-3 rounded bg-white p-3 text-xs">
        <div>
          <p className="text-gray-600">Dismiss Rate</p>
          <p className="font-semibold text-gray-900">
            {recommendation.dismiss_rate.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-gray-600">Sample Size</p>
          <p className="font-semibold text-gray-900">
            {recommendation.sample_size} alerts
          </p>
        </div>
        <div>
          <p className={`${confidenceColor} font-semibold`}>Confidence</p>
          <p className={`${confidenceColor} font-semibold`}>
            {(recommendation.confidence_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => onApply(recommendation)}
          disabled={isApplying}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isApplying ? 'Applying...' : 'Apply Recommendation'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        {onDismiss && (
          <Button
            onClick={() => onDismiss(recommendation.anomaly_type)}
            variant="outline"
            className="px-3"
          >
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
