import api from '@/lib/axios'

export interface TariffApi {
  id: string
  name: string
  pricePerHour: number
  pricePerHalfHour: number
  toleranceMinutes: number
  dailyMax: number | null
  overnightRate: number | null
  overnightStartHour: number
  overnightEndHour: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo: string | null
}

export const tariffsService = {
  findAll(activeOnly?: boolean): Promise<TariffApi[]> {
    return api.get('/tariffs', { params: activeOnly ? { active: 'true' } : {} }).then(r => r.data)
  },
  findOne(id: string): Promise<TariffApi> {
    return api.get(`/tariffs/${id}`).then(r => r.data)
  },
  create(data: Omit<TariffApi, 'id'>): Promise<TariffApi> {
    return api.post('/tariffs', data).then(r => r.data)
  },
  update(id: string, data: Partial<Omit<TariffApi, 'id'>>): Promise<TariffApi> {
    return api.patch(`/tariffs/${id}`, data).then(r => r.data)
  },
  remove(id: string): Promise<void> {
    return api.delete(`/tariffs/${id}`).then(() => undefined)
  },
}
