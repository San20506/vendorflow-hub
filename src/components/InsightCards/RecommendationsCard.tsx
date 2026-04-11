import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import type { InsightCard } from '@/types/insights'

interface Props {
  insight: InsightCard
}

export default function RecommendationsCard({ insight }: Props) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-gray-900">{insight.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{insight.context}</p>
          </div>
          <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900">AI Recommendation</p>
            <p className="text-sm text-yellow-800 mt-2">{insight.recommendation}</p>
          </div>

          {insight.actionItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Actionable Steps</p>
              <ol className="space-y-2">
                {insight.actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 flex items-start p-2 bg-gray-50 rounded"
                  >
                    <span className="font-bold text-yellow-600 mr-2">{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Impact Metric</p>
            <p className="text-sm font-bold text-gray-800">{insight.metric}</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">AI Generated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
