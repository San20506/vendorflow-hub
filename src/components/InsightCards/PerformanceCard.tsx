import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { InsightCard } from '@/types/insights'

interface Props {
  insight: InsightCard
}

export default function PerformanceCard({ insight }: Props) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-gray-900">{insight.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{insight.context}</p>
          </div>
          <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Key Metric</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{insight.metric}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700">Recommendation</p>
            <p className="text-sm text-gray-600 mt-1">{insight.recommendation}</p>
          </div>

          {insight.actionItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Action Items</p>
              <ul className="space-y-1">
                {insight.actionItems.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Performance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
