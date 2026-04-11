export type ReportType = 'daily' | 'weekly'
export type ReportChannel = 'email' | 'sms' | 'slack'
export type ReportStatus = 'success' | 'failed'

export interface AlertSummary {
  total: number
  critical: number
  warning: number
  info: number
}

export interface KeyMetrics {
  revenue: {
    current: number
    previous: number
    change: number
  }
  inventory: {
    stockedProducts: number
    lowStockProducts: number
    outOfStockProducts: number
  }
  channels: {
    name: string
    status: 'healthy' | 'warning' | 'critical'
    performanceScore: number
  }[]
}

export interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  action: string
}

export interface Report {
  id: string
  vendorId: string
  reportType: ReportType
  generatedAt: string
  alertSummary: AlertSummary
  topRecommendations: Recommendation[]
  keyMetrics: KeyMetrics
  insights: Array<{
    title: string
    description: string
    confidence: number
  }>
}

export interface ReportFormat {
  title: string
  alertSummary: AlertSummary
  topRecommendations: Recommendation[]
  keyMetrics: KeyMetrics
  insights: Array<{
    title: string
    description: string
    confidence: number
  }>
}

export interface ReportPreference {
  id: string
  vendorId: string
  reportType: ReportType
  enabled: boolean
  channels: ReportChannel[]
  smsPhone?: string
  slackWebhookUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ReportHistory {
  id: string
  vendorId: string
  reportType: ReportType
  generatedAt: string
  sentAt?: string
  channelsSent: ReportChannel[]
  status: ReportStatus
  errorMessage?: string
}
