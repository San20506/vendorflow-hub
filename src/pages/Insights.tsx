import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { insightEngine } from '@/lib/insight-engine'
import { getCurrentVendor } from '@/lib/queries'
import type { InsightCard } from '@/types/insights'
import PerformanceCard from '@/components/InsightCards/PerformanceCard'
import ChannelComparisonCard from '@/components/InsightCards/ChannelComparisonCard'
import InventoryCard from '@/components/InsightCards/InventoryCard'
import RevenueCard from '@/components/InsightCards/RevenueCard'
import RecommendationsCard from '@/components/InsightCards/RecommendationsCard'
import AlertPanel from '@/components/AlertPanel'

export default function InsightsHub() {
  const [insights, setInsights] = useState<InsightCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString())
  const [alertRefetch, setAlertRefetch] = useState(0)

  // Fetch current vendor
  const {
    data: vendor,
    isLoading: vendorLoading,
    isError: vendorError
  } = useQuery({
    queryKey: ['current-vendor'],
    queryFn: getCurrentVendor,
    staleTime: 1000 * 60 * 5
  })

  // Generate insights
  const generateInsights = async () => {
    if (!vendor?.vendor_id) return

    setLoading(true)
    setError(null)

    try {
      const generatedInsights = await insightEngine.generateAllInsights(vendor.vendor_id)
      setInsights(generatedInsights)
      setLastUpdated(new Date().toISOString())
      // Trigger alert panel refresh
      setAlertRefetch((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
      console.error('Insight generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate insights on load
  useEffect(() => {
    if (vendor?.vendor_id && insights.length === 0) {
      generateInsights()
    }
  }, [vendor?.vendor_id])

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (vendorError || !vendor) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">Failed to load vendor information</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your AI Insights</h1>
            <p className="text-gray-600 mt-1">{vendor.name} — Multi-channel performance analysis</p>
          </div>
          <Button onClick={generateInsights} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh Insights'}
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Alert Panel */}
      {vendor?.vendor_id && <AlertPanel vendorId={vendor.vendor_id} refetchTrigger={alertRefetch} />}

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && insights.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights Grid */}
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight) => (
            <div key={insight.id}>
              {insight.insightType === 'performance' && <PerformanceCard insight={insight} />}
              {insight.insightType === 'channel_comparison' && (
                <ChannelComparisonCard insight={insight} />
              )}
              {insight.insightType === 'inventory' && <InventoryCard insight={insight} />}
              {insight.insightType === 'revenue' && <RevenueCard insight={insight} />}
              {insight.insightType === 'recommendations' && (
                <RecommendationsCard insight={insight} />
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <Card className="border-gray-200">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">No insights generated yet. Click Refresh to analyze your data.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
