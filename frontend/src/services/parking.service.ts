import api from '@/lib/axios'

export interface ParkingSessionApi {
  id: string
  ticketNumber: string
  vehicle: { id: string; plate: string; type: string }
  tariff: { id: string; name: string; pricePerHour: number; toleranceMinutes: number; dailyMax: number | null }
  entryBy: { id: string; name: string }
  exitBy: { id: string; name: string } | null
  space: { id: string; code: string; type: string } | null
  entryTime: string
  exitTime: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
}

export interface TicketApi {
  id: string
  sessionId: string
  durationMinutes: number
  subtotal: number
  discountAmount: number
  totalAmount: number
  status: string
}

export interface ParkingStats {
  activeCount: number
  completedToday: number
  avgDurationMinutes: number
  revenueToday: number
}

export interface PreviewCostApi {
  durationMinutes: number
  hasMonthlyPass: boolean
  estimatedTotal: number
}

export const parkingService = {
  getStats(): Promise<ParkingStats> {
    return api.get('/parking/stats').then(r => r.data)
  },
  previewCost(sessionId: string): Promise<PreviewCostApi> {
    return api.get(`/parking/sessions/${sessionId}/preview-cost`).then(r => r.data)
  },
  findAll(status?: string): Promise<ParkingSessionApi[]> {
    return api.get('/parking/sessions', { params: status ? { status } : {} }).then(r => r.data.data)
  },
  findOne(id: string): Promise<ParkingSessionApi> {
    return api.get(`/parking/sessions/${id}`).then(r => r.data)
  },
  createEntry(data: { plate: string; vehicleType?: string; tariffId: string; spaceCode: string; notes?: string }): Promise<ParkingSessionApi> {
    return api.post('/parking/entry', data).then(r => r.data)
  },
  processExit(
    sessionId: string,
    data: { paymentMethod: string; receivedAmount?: number; shiftId?: string; notes?: string },
  ): Promise<{ session: ParkingSessionApi; ticket: TicketApi }> {
    return api.post(`/parking/sessions/${sessionId}/exit`, data).then(r => r.data)
  },
}
