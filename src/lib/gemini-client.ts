import { GoogleGenerativeAI } from '@google/generative-ai'

export interface VendorData {
  vendorId: string
  channels: ChannelData[]
  timeframe: string
  contextType: 'performance' | 'inventory' | 'revenue' | 'trends' | 'recommendations'
}

export interface ChannelData {
  name: string
  totalRevenue: number
  topProducts: { name: string; sales: number }[]
  stockLevel: number
  growth: number
}

export interface InsightResponse {
  insight: string
  actionItems: string[]
  confidence: number
}

class GeminiClient {
  private client: GoogleGenerativeAI | null = null

  private getApiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    if (!key) {
      throw new Error('GEMINI_API_KEY not configured. Set VITE_GEMINI_API_KEY in .env.local')
    }
    return key
  }

  private ensureClient(): GoogleGenerativeAI {
    if (!this.client) {
      this.client = new GoogleGenerativeAI(this.getApiKey())
    }
    return this.client
  }

  async streamInsight(vendorData: VendorData): Promise<ReadableStream<string>> {
    const client = this.ensureClient()
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = this.buildPrompt(vendorData)

    try {
      const result = await model.generateContentStream(prompt)

      // Convert stream to ReadableStream for browser compatibility
      let buffer = ''

      return new ReadableStream<string>({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text()
              if (text) {
                buffer += text
                controller.enqueue(text)
              }
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })
    } catch (error) {
      return this.handleError(error)
    }
  }

  async generateInsight(vendorData: VendorData): Promise<InsightResponse> {
    const client = this.ensureClient()
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = this.buildPrompt(vendorData)

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      return {
        insight: text,
        actionItems: this.extractActionItems(text),
        confidence: 0.9
      }
    } catch (error) {
      throw new Error(`Gemini API error: ${this.formatError(error)}`)
    }
  }

  private buildPrompt(vendorData: VendorData): string {
    const { channels, timeframe, contextType } = vendorData

    const channelsDescription = channels
      .map(
        (ch) =>
          `- ${ch.name}: $${ch.totalRevenue.toLocaleString()} revenue (${(ch.growth * 100).toFixed(1)}% growth), ` +
          `${ch.topProducts.length} top products, ${ch.stockLevel} units in stock`
      )
      .join('\n')

    const prompts: Record<string, string> = {
      performance: `Analyze performance data for a vendor across channels in the ${timeframe}:
${channelsDescription}

Provide 2-3 KEY INSIGHTS about product performance and channel strength. Format each insight as:
- [Insight Title]: [1-2 sentence insight with specific metrics]`,

      channel_comparison: `Compare channel performance for a vendor in the ${timeframe}:
${channelsDescription}

Provide 2-3 CHANNEL COMPARISON insights highlighting which channels perform best and why. Include specific revenue differences and growth gaps.`,

      inventory: `Analyze inventory health for a vendor across channels in the ${timeframe}:
${channelsDescription}

Provide 2-3 INVENTORY INSIGHTS including stock levels, reorder recommendations, and stockout risks. Be specific with quantities and reorder thresholds.`,

      revenue: `Analyze revenue distribution for a vendor across channels in the ${timeframe}:
${channelsDescription}

Provide 2-3 REVENUE INSIGHTS including top-selling products, revenue concentration, and profit opportunities by channel.`,

      trends: `Identify trends and patterns for a vendor across channels in the ${timeframe}:
${channelsDescription}

Provide 2-3 TREND INSIGHTS including growth patterns, seasonal signals, and recommended actions based on data trajectory.`,

      recommendations: `Generate AI recommendations for a vendor based on performance in the ${timeframe}:
${channelsDescription}

Provide 3 ACTIONABLE RECOMMENDATIONS for: pricing optimization, inventory allocation, and channel focus. Be specific and quantified.`
    }

    return prompts[contextType] || prompts.performance
  }

  private extractActionItems(text: string): string[] {
    // Extract action items from insight text (lines starting with -, •, or numbers)
    const lines = text.split('\n')
    return lines
      .filter((line) => /^[\s]*[-•*\d.]\s/.test(line))
      .map((line) => line.replace(/^[\s]*[-•*\d.]\s+/, '').trim())
      .filter((line) => line.length > 0)
  }

  private handleError(error: unknown): ReadableStream<string> {
    const message = this.formatError(error)
    return new ReadableStream<string>({
      start(controller) {
        controller.enqueue(`Error: ${message}`)
        controller.close()
      }
    })
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return 'Gemini API key not configured'
      }
      if (error.message.includes('rate')) {
        return 'API rate limit exceeded. Please try again later.'
      }
      return error.message
    }
    return String(error)
  }
}

// Singleton instance
const geminiClient = new GeminiClient()

export default geminiClient
