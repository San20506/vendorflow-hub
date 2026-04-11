// Insight Types

export type InsightType =
  | 'performance'
  | 'channel_comparison'
  | 'inventory'
  | 'revenue'
  | 'trends'
  | 'recommendations'

export interface InsightCard {
  id: string
  title: string
  context: string
  metric: string
  recommendation: string
  insightType: InsightType
  actionItems: string[]
  confidence: number
  timestamp: string
}

export interface InsightMetrics {
  totalRevenue: number
  topProducts: { name: string; sales: number; growth: number }[]
  channelData: {
    channel: string
    revenue: number
    percentage: number
    growth: number
  }[]
  inventoryStatus: {
    totalUnits: number
    lowStockItems: number
    estimatedStockoutRisk: string[]
  }
  trends: {
    period: string
    growth: number
    topPerformer: string
    underperformer: string
  }
}

export interface GenerateInsightRequest {
  vendorId: string
  insightTypes: InsightType[]
  timeframe: 'last_7_days' | 'last_30_days' | 'last_90_days'
  includeCharts: boolean
}

export interface InsightDashboardData {
  vendorId: string
  cards: InsightCard[]
  metrics: InsightMetrics
  lastUpdated: string
  isLoading: boolean
  error?: string
}
