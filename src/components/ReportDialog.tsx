import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ReportDialogProps {
  reportType: 'daily' | 'weekly'
  onClose: () => void
}

export default function ReportDialog({ reportType, onClose }: ReportDialogProps) {
  const title = reportType === 'daily' ? 'Daily Report Preview' : 'Weekly Report Preview'
  const frequency = reportType === 'daily' ? 'Every day at 9 AM UTC' : 'Every Monday at 6 AM UTC'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Sample report format sent {frequency}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sample Report Preview */}
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-4 rounded-lg">
              <h2 className="text-2xl font-bold mb-1">
                {reportType === 'daily' ? 'Daily' : 'Weekly'} Insights Report
              </h2>
              <p className="text-purple-100 text-sm">Generated today</p>
            </div>

            {/* Alert Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Alert Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Alerts</p>
                    <p className="text-2xl font-bold">7</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Critical</p>
                    <p className="text-2xl font-bold text-red-600">2</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Warnings</p>
                    <p className="text-2xl font-bold text-orange-600">3</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Info</p>
                    <p className="text-2xl font-bold text-blue-600">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Top Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded">
                  <p className="font-semibold text-red-900">Revenue Drop Alert</p>
                  <p className="text-sm text-red-800 mt-1">Shopify revenue dropped 23% below baseline</p>
                  <p className="text-xs text-red-700 mt-2">Confidence: 95% • Action: Review sales metrics</p>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-600 p-3 rounded">
                  <p className="font-semibold text-orange-900">Inventory Alert</p>
                  <p className="text-sm text-orange-800 mt-1">3 products approaching stockout in 5 days</p>
                  <p className="text-xs text-orange-700 mt-2">Confidence: 88% • Action: Reorder immediately</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
                  <p className="font-semibold text-blue-900">Trend Reversal</p>
                  <p className="text-sm text-blue-800 mt-1">Amazon sales growth reversed to -12% vs trend</p>
                  <p className="text-xs text-blue-700 mt-2">Confidence: 82% • Action: Analyze market conditions</p>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">High-margin products outperforming</p>
                    <p className="text-xs text-gray-600">Margin categories driving 68% of profit</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Channel concentration risk detected</p>
                    <p className="text-xs text-gray-600">75% of revenue from single channel</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Weekend demand spike consistent</p>
                    <p className="text-xs text-gray-600">Weekend sales 40% higher, repeatable pattern</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-700 mb-3">
                Reports are sent directly to your configured delivery channels
              </p>
              <a href="https://app.vendorflow-hub.com/insights" className="inline-block bg-purple-600 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700 transition-colors">
                View Full Dashboard
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
