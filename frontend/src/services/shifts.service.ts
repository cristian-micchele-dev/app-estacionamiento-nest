import api from '@/lib/axios'

export interface ShiftApi {
  id: string
  cashier: { id: string; name: string }
  openedAt: string
  closedAt: string | null
  openingBalance: number
  closingBalanceCounted: number | null
  closingBalanceSystem: number | null
  difference: number | null
  status: 'OPEN' | 'CLOSED'
  notes: string | null
}

export const shiftsService = {
  findAll(): Promise<ShiftApi[]> {
    return api.get('/shifts').then(r => r.data.data)
  },
  findActive(): Promise<ShiftApi | null> {
    return api.get('/shifts/active').then(r => r.data)
  },
  open(openingBalance: number): Promise<ShiftApi> {
    return api.post('/shifts/open', { openingBalance }).then(r => r.data)
  },
  close(shiftId: string, closingBalanceCounted: number, notes?: string): Promise<ShiftApi> {
    return api.post(`/shifts/${shiftId}/close`, { closingBalanceCounted, notes }).then(r => r.data)
  },
}
