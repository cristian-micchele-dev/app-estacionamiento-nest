import api from '@/lib/axios'

export type InsightKey =
  | 'active-sessions'
  | 'today-revenue'
  | 'vehicles-inside'
  | 'last-shift-difference'
  | 'card-payments-today'
  | 'monthly-entries'
  | 'top-tariff'
  | 'top-vehicle'
  | 'active-passes'
  | 'expiring-passes'

export const chatService = {
  insight(key: InsightKey): Promise<{ answer: string }> {
    return api.get(`/chat/insights/${key}`).then((r) => r.data)
  },
}
