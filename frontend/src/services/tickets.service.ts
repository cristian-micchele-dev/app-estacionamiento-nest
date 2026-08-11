import api from '@/lib/axios'
import type { PaginatedResult } from '@/types/api.types'

export type TicketStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface TicketVehicleApi {
  plate: string
  type: string
}

export interface TicketSessionApi {
  ticketNumber: string
  vehicleId: string
  vehicle?: TicketVehicleApi
}

export interface TicketApi {
  id: string
  sessionId: string
  durationMinutes: number
  subtotal: number
  discountAmount: number
  totalAmount: number
  status: TicketStatus
  createdAt: string
  session?: TicketSessionApi
}

export interface TicketQuery {
  search?: string
  status?: TicketStatus
  dateFrom?: string
  dateTo?: string
  all?: boolean
  page?: number
  limit?: number
}

export const ticketsService = {
  findAll(params?: TicketQuery): Promise<PaginatedResult<TicketApi>> {
    return api.get('/tickets', { params }).then(r => r.data)
  },
  findOne(id: string): Promise<TicketApi> {
    return api.get(`/tickets/${id}`).then(r => r.data)
  },
  cancel(id: string): Promise<TicketApi> {
    return api.patch(`/tickets/${id}/cancel`).then(r => r.data)
  },
}
