/**
 * Insight Engine
 * Transforms raw channel data into context-aware business intelligence
 */

import geminiClient, { VendorData, ChannelData } from './gemini-client'
import { getChannelsForVendor, getChannelProducts } from './channels'
import { getOrdersForVendor, getProducts } from './queries'
import type { InsightCard, InsightType, InsightMetrics } from '../types/insights'
import { supabase } from '../integrations/supabase/client'

export class InsightEngine {
  /**
   * Generate insights for all insight types
   */
  async generateAllInsights(vendorId: string): Promise<InsightCard[]> {
    const insightTypes: InsightType[] = [
      'performance',
      'channel_comparison',
      'inventory',
      'revenue',
      'trends',
      'recommendations'
    ]

    const insights: InsightCard[] = []

    for (const insightType of insightTypes) {
      const insight = await this.generateInsight(vendorId, insightType)
      if (insight) {
        insights.push(insight)
      }
    }

    return insights
  }

  /**
   * Generate a specific insight type
   */
  async generateInsight(vendorId: string, insightType: InsightType): Promise<InsightCard | null> {
    try {
      const vendorData = await this.collectVendorData(vendorId, insightType)
      if (!vendorData.channels.length) {
        return null
      }

      const response = await geminiClient.generateInsight(vendorData)

      return {
        id: `${insightType}-${Date.now()}`,
        title: this.extractTitle(response.insight, insightType),
        context: this.extractContext(response.insight),
        metric: this.extractMetric(response.insight),
        recommendation: this.extractRecommendation(response.insight),
        insightType,
        actionItems: response.actionItems,
        confidence: response.confidence,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error generating ${insightType} insight:`, error)
      return null
    }
  }

  /**
   * Collect vendor data from Supabase
   */
  private async collectVendorData(vendorId: string, contextType: InsightType): Promise<VendorData> {
    const channels = await getChannelsForVendor(vendorId)
    const orders = await getOrdersForVendor(vendorId)
    const products = await getProducts(vendorId)

    const channelData: ChannelData[] = []

    for (const channel of channels) {
      const channelProducts = await getChannelProducts(channel.channel_id, 10)
      const channelOrders = orders.filter((o) => o.channel_id === channel.channel_id)

      const totalRevenue = channelOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      const topProducts = channelProducts
        .map((p) => ({
          name: p.name || 'Unknown',
          sales: channelOrders.filter((o) => o.product_id === p.product_id).length
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      const stockLevel = channelProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)

      // Calculate growth (mock - would be actual period-over-period)
      const growth = Math.random() * 0.5 - 0.1 // -10% to +40%

      channelData.push({
        name: channel.platform || 'Unknown Channel',
        totalRevenue,
        topProducts,
        stockLevel,
        growth
      })
    }

    return {
      vendorId,
      channels: channelData,
      timeframe: 'last_30_days',
      contextType: contextType as VendorData['contextType']
    }
  }

  /**
   * Calculate metrics for dashboard display
   */
  async calculateMetrics(vendorId: string): Promise<InsightMetrics> {
    const channels = await getChannelsForVendor(vendorId)
    const orders = await getOrdersForVendor(vendorId)
    const products = await getProducts(vendorId)

    let totalRevenue = 0
    const channelData: InsightMetrics['channelData'] = []

    for (const channel of channels) {
      const channelOrders = orders.filter((o) => o.channel_id === channel.channel_id)
      const channelRevenue = channelOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      totalRevenue += channelRevenue

      channelData.push({
        channel: channel.platform || 'Unknown',
        revenue: channelRevenue,
        percentage: 0, // Will be calculated after total
        growth: (Math.random() * 0.5 - 0.1) * 100 // Mock growth %
      })
    }

    // Calculate percentages
    channelData.forEach((cd) => {
      cd.percentage = totalRevenue > 0 ? (cd.revenue / totalRevenue) * 100 : 0
    })

    const topProducts = products
      .map((p) => {
        const productOrders = orders.filter((o) => o.product_id === p.product_id)
        const sales = productOrders.length
        const growth = (Math.random() * 0.5 - 0.1) * 100
        return {
          name: p.name || 'Unknown',
          sales,
          growth
        }
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    const lowStockItems = products.filter((p) => (p.quantity || 0) < 10).length
    const estimatedStockoutRisk = products
      .filter((p) => (p.quantity || 0) < 5)
      .map((p) => p.name || 'Unknown')
      .slice(0, 5)

    return {
      totalRevenue,
      topProducts,
      channelData,
      inventoryStatus: {
        totalUnits: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
        lowStockItems,
        estimatedStockoutRisk
      },
      trends: {
        period: 'last_30_days',
        growth: (Math.random() * 0.4 - 0.05) * 100,
        topPerformer: channelData.sort((a, b) => b.revenue - a.revenue)[0]?.channel || 'N/A',
        underperformer: channelData.sort((a, b) => a.revenue - b.revenue)[0]?.channel || 'N/A'
      }
    }
  }

  /**
   * Extract structured data from Gemini response
   */
  private extractTitle(insight: string, type: InsightType): string {
    const lines = insight.split('\n')
    const titleLine = lines.find((l) => l.includes(':') && l.length < 80)
    if (titleLine) {
      return titleLine.replace(/^[-•*\d.]\s+/, '').split(':')[0].trim()
    }
    return this.defaultTitles[type]
  }

  private extractContext(insight: string): string {
    const lines = insight.split('\n')
    const contextLine = lines
      .find((l) => l.includes('is') || l.includes('are') || l.includes('shows'))
      ?.substring(0, 150)
    return contextLine || 'Analysis from channel data'
  }

  private extractMetric(insight: string): string {
    const numbers = insight.match(/\$?[\d,]+\.?[\d]*%?/g)
    if (numbers && numbers.length > 0) {
      return numbers[0]
    }
    return 'See details'
  }

  private extractRecommendation(insight: string): string {
    const lines = insight.split('\n')
    const recLine = lines.find(
      (l) =>
        l.toLowerCase().includes('recommend') ||
        l.toLowerCase().includes('suggest') ||
        l.toLowerCase().includes('consider')
    )
    return recLine?.substring(0, 200) || 'Take action based on insights'
  }

  private defaultTitles: Record<InsightType, string> = {
    performance: 'Performance Summary',
    channel_comparison: 'Channel Comparison',
    inventory: 'Inventory Health',
    revenue: 'Revenue Analysis',
    trends: 'Market Trends',
    recommendations: 'AI Recommendations'
  }
}

// Export singleton
export const insightEngine = new InsightEngine()
