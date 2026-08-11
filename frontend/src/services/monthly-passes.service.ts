import api from '@/lib/axios'

export interface MonthlyPassApi {
  id: string
  vehicleId: string
  vehicle: { id: string; plate: string; type: string }
  holderName: string
  holderPhone: string | null
  holderEmail: string | null
  validFrom: string
  validTo: string
  pricePaid: number
  isActive: boolean
  notes: string | null
}

export const monthlyPassesService = {
  findAll(activeOnly?: boolean): Promise<MonthlyPassApi[]> {
    return api.get('/monthly-passes', { params: activeOnly ? { active: 'true' } : {} }).then(r => r.data.data)
  },
  findOne(id: string): Promise<MonthlyPassApi> {
    return api.get(`/monthly-passes/${id}`).then(r => r.data)
  },
  create(data: {
    vehicleId: string
    holderName: string
    holderPhone?: string | null
    holderEmail?: string | null
    validFrom: string
    validTo: string
    pricePaid: number
    isActive?: boolean
    notes?: string | null
  }): Promise<MonthlyPassApi> {
    return api.post('/monthly-passes', data).then(r => r.data)
  },
  update(id: string, data: Partial<Omit<MonthlyPassApi, 'id' | 'vehicleId' | 'vehicle'>>): Promise<MonthlyPassApi> {
    return api.patch(`/monthly-passes/${id}`, data).then(r => r.data)
  },
  remove(id: string): Promise<void> {
    return api.delete(`/monthly-passes/${id}`).then(() => undefined)
  },
}
