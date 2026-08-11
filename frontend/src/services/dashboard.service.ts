import api from '@/lib/axios'

export type DashboardPeriod = 'day' | 'week' | 'month'

export interface DashboardSeriesPoint {
  date: string
  sessions: number
  quoted: number
  collected: number
}

export interface DashboardStats {
  activeSessions: number
  totalSessions: number
  totalQuoted: number
  totalCollected: number
  avgTicket: number
  collectionRate: number
  series: DashboardSeriesPoint[]
}

export const dashboardService = {
  getStats(period: DashboardPeriod): Promise<DashboardStats> {
    return api.get('/dashboard/stats', { params: { period } }).then(r => r.data)
  },
}
