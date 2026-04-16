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
   * Generate all insights in a single Gemini API call to avoid rate limits.
   */
  async generateAllInsights(vendorId: string): Promise<InsightCard[]> {
    const vendorData = await this.collectVendorData(vendorId, 'performance')
    if (!vendorData.channels.length) return []

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const key = import.meta.env.VITE_GEMINI_API_KEY
    if (!key) throw new Error('VITE_GEMINI_API_KEY not set')

    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const channelsSummary = vendorData.channels
      .map(
        (ch) =>
          `• ${ch.name}: ₹${ch.totalRevenue.toLocaleString()} revenue, ` +
          `${ch.stockLevel} units, ${(ch.growth * 100).toFixed(1)}% growth\n` +
          `  Top products: ${ch.topProducts.map((p) => p.name).join(', ')}`
      )
      .join('\n')

    const prompt = `You are a business analyst for an Indian e-commerce vendor selling baby/maternity products (pregnancy pillows, breastfeeding pillows, nursing covers, baby cradles) on Amazon and Firstcry.

Channel data:
${channelsSummary}

Generate exactly 5 insights in this JSON format (respond ONLY with valid JSON, no markdown):
[
  {"type":"performance","title":"...","context":"...","metric":"...","recommendation":"...","actionItems":["...","..."]},
  {"type":"channel_comparison","title":"...","context":"...","metric":"...","recommendation":"...","actionItems":["...","..."]},
  {"type":"revenue","title":"...","context":"...","metric":"...","recommendation":"...","actionItems":["...","..."]},
  {"type":"inventory","title":"...","context":"...","metric":"...","recommendation":"...","actionItems":["...","..."]},
  {"type":"recommendations","title":"...","context":"...","metric":"...","recommendation":"...","actionItems":["...","..."]}
]

Each insight must reference the actual product names and numbers from the data above.`

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const json = text.startsWith('[') ? text : text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
      const parsed: Array<{ type: string; title: string; context: string; metric: string; recommendation: string; actionItems: string[] }> = JSON.parse(json)

      return parsed.map((item) => ({
        id: `${item.type}-${Date.now()}`,
        title: item.title,
        context: item.context,
        metric: item.metric,
        recommendation: item.recommendation,
        insightType: item.type as InsightType,
        actionItems: item.actionItems ?? [],
        confidence: 0.9,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Insight generation failed:', error)
      return []
    }
  }

  /**
   * Generate a specific insight type (single call, kept for compatibility)
   */
  async generateInsight(vendorId: string, insightType: InsightType): Promise<InsightCard | null> {
    const all = await this.generateAllInsights(vendorId)
    return all.find((i) => i.insightType === insightType) ?? null
  }

  /**
   * Collect vendor data from Supabase.
   * Reads from platform_orders / platform_settlements (imported data),
   * falling back to legacy channels/orders tables if platform_orders is empty.
   */
  private async collectVendorData(vendorId: string, contextType: InsightType): Promise<VendorData> {
    // Query platform_orders grouped by platform
    const { data: platformOrders } = await supabase
      .from('platform_orders')
      .select('platform, platform_order_id, product_name, sku, quantity, sale_amount, mrp, status, order_date')
      .eq('vendor_id', vendorId)

    const { data: platformSettlements } = await supabase
      .from('platform_settlements')
      .select('platform, net_settlement, sale_amount')
      .eq('vendor_id', vendorId)

    const channelData: ChannelData[] = []

    if (platformOrders && platformOrders.length > 0) {
      // Derive channel data from platform_orders
      const platforms = [...new Set(platformOrders.map((o) => o.platform).filter(Boolean))]

      for (const platform of platforms) {
        const orders = platformOrders.filter((o) => o.platform === platform)
        const settlements = platformSettlements?.filter((s) => s.platform === platform) ?? []

        // Revenue: prefer settlements net_settlement, else sum sale_amount from orders
        const totalRevenue =
          settlements.length > 0
            ? settlements.reduce((sum, s) => sum + (s.net_settlement ?? s.sale_amount ?? 0), 0)
            : orders.reduce((sum, o) => sum + (o.sale_amount ?? 0), 0)

        // Top products by order count
        const productSales: Record<string, number> = {}
        for (const o of orders) {
          const key = o.product_name || o.sku || 'Unknown'
          productSales[key] = (productSales[key] ?? 0) + (o.quantity ?? 1)
        }
        const topProducts = Object.entries(productSales)
          .map(([name, sales]) => ({ name, sales }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)

        // Growth: compare last 30 days vs prior 30 days
        const now = Date.now()
        const ms30 = 30 * 24 * 60 * 60 * 1000
        const recent = orders.filter(
          (o) => o.order_date && now - new Date(o.order_date).getTime() < ms30
        )
        const prior = orders.filter((o) => {
          if (!o.order_date) return false
          const age = now - new Date(o.order_date).getTime()
          return age >= ms30 && age < ms30 * 2
        })
        const recentRev = recent.reduce((s, o) => s + (o.sale_amount ?? 0), 0)
        const priorRev = prior.reduce((s, o) => s + (o.sale_amount ?? 0), 0)
        const growth = priorRev > 0 ? (recentRev - priorRev) / priorRev : 0

        channelData.push({
          name: platform.charAt(0).toUpperCase() + platform.slice(1),
          totalRevenue,
          topProducts,
          stockLevel: orders.reduce((s, o) => s + (o.quantity ?? 0), 0),
          growth
        })
      }
    } else {
      // Fallback to legacy channels/orders tables
      const channels = await getChannelsForVendor(vendorId)
      const orders = await getOrdersForVendor(vendorId)
      const products = await getProducts(vendorId)

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
        channelData.push({
          name: channel.platform || 'Unknown Channel',
          totalRevenue,
          topProducts,
          stockLevel,
          growth: 0
        })
      }
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
    const { data: platformOrders } = await supabase
      .from('platform_orders')
      .select('platform, product_name, sku, quantity, sale_amount, order_date')
      .eq('vendor_id', vendorId)

    const { data: platformSettlements } = await supabase
      .from('platform_settlements')
      .select('platform, net_settlement, sale_amount')
      .eq('vendor_id', vendorId)

    if (platformOrders && platformOrders.length > 0) {
      const platforms = [...new Set(platformOrders.map((o) => o.platform).filter(Boolean))]
      const channelData: InsightMetrics['channelData'] = []
      let totalRevenue = 0

      const now = Date.now()
      const ms30 = 30 * 24 * 60 * 60 * 1000

      for (const platform of platforms) {
        const orders = platformOrders.filter((o) => o.platform === platform)
        const settlements = platformSettlements?.filter((s) => s.platform === platform) ?? []
        const channelRevenue =
          settlements.length > 0
            ? settlements.reduce((s, r) => s + (r.net_settlement ?? r.sale_amount ?? 0), 0)
            : orders.reduce((s, o) => s + (o.sale_amount ?? 0), 0)
        totalRevenue += channelRevenue

        const recent = orders.filter(
          (o) => o.order_date && now - new Date(o.order_date).getTime() < ms30
        )
        const prior = orders.filter((o) => {
          if (!o.order_date) return false
          const age = now - new Date(o.order_date).getTime()
          return age >= ms30 && age < ms30 * 2
        })
        const recentRev = recent.reduce((s, o) => s + (o.sale_amount ?? 0), 0)
        const priorRev = prior.reduce((s, o) => s + (o.sale_amount ?? 0), 0)
        const growth = priorRev > 0 ? ((recentRev - priorRev) / priorRev) * 100 : 0

        channelData.push({
          channel: platform.charAt(0).toUpperCase() + platform.slice(1),
          revenue: channelRevenue,
          percentage: 0,
          growth
        })
      }

      channelData.forEach((cd) => {
        cd.percentage = totalRevenue > 0 ? (cd.revenue / totalRevenue) * 100 : 0
      })

      // Aggregate top products
      const productSales: Record<string, number> = {}
      for (const o of platformOrders) {
        const key = o.product_name || o.sku || 'Unknown'
        productSales[key] = (productSales[key] ?? 0) + (o.quantity ?? 1)
      }
      const topProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales, growth: 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      const sorted = [...channelData].sort((a, b) => b.revenue - a.revenue)

      return {
        totalRevenue,
        topProducts,
        channelData,
        inventoryStatus: {
          totalUnits: platformOrders.reduce((s, o) => s + (o.quantity ?? 0), 0),
          lowStockItems: 0,
          estimatedStockoutRisk: []
        },
        trends: {
          period: 'last_30_days',
          growth: channelData.reduce((s, c) => s + c.growth, 0) / (channelData.length || 1),
          topPerformer: sorted[0]?.channel || 'N/A',
          underperformer: sorted[sorted.length - 1]?.channel || 'N/A'
        }
      }
    }

    // Fallback: legacy tables
    const channels = await getChannelsForVendor(vendorId)
    const orders = await getOrdersForVendor(vendorId)
    const products = await getProducts(vendorId)
    let totalRevenue = 0
    const channelData: InsightMetrics['channelData'] = []
    for (const channel of channels) {
      const channelOrders = orders.filter((o) => o.channel_id === channel.channel_id)
      const channelRevenue = channelOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      totalRevenue += channelRevenue
      channelData.push({ channel: channel.platform || 'Unknown', revenue: channelRevenue, percentage: 0, growth: 0 })
    }
    channelData.forEach((cd) => { cd.percentage = totalRevenue > 0 ? (cd.revenue / totalRevenue) * 100 : 0 })
    const topProducts = products
      .map((p) => ({ name: p.name || 'Unknown', sales: orders.filter((o) => o.product_id === p.product_id).length, growth: 0 }))
      .sort((a, b) => b.sales - a.sales).slice(0, 5)
    const sorted = [...channelData].sort((a, b) => b.revenue - a.revenue)
    return {
      totalRevenue, topProducts, channelData,
      inventoryStatus: {
        totalUnits: products.reduce((s, p) => s + (p.quantity || 0), 0),
        lowStockItems: products.filter((p) => (p.quantity || 0) < 10).length,
        estimatedStockoutRisk: products.filter((p) => (p.quantity || 0) < 5).map((p) => p.name || 'Unknown').slice(0, 5)
      },
      trends: { period: 'last_30_days', growth: 0, topPerformer: sorted[0]?.channel || 'N/A', underperformer: sorted[sorted.length - 1]?.channel || 'N/A' }
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
