import api from '@/lib/axios'
import type { PaginatedResult } from '@/types/api.types'

export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'BUS'

export interface VehicleApi {
  id: string
  plate: string
  type: VehicleType
  brand: string | null
  color: string | null
  observations: string | null
  createdAt: string
}

export interface VehicleQuery {
  search?: string
  type?: VehicleType
  page?: number
  limit?: number
}

export const vehiclesService = {
  findAll(params?: VehicleQuery): Promise<PaginatedResult<VehicleApi>> {
    return api.get('/vehicles', { params }).then(r => r.data)
  },
  findOne(id: string): Promise<VehicleApi> {
    return api.get(`/vehicles/${id}`).then(r => r.data)
  },
  create(data: Omit<VehicleApi, 'id' | 'createdAt'>): Promise<VehicleApi> {
    return api.post('/vehicles', data).then(r => r.data)
  },
  update(id: string, data: Partial<Omit<VehicleApi, 'id' | 'createdAt' | 'plate'>>): Promise<VehicleApi> {
    return api.patch(`/vehicles/${id}`, data).then(r => r.data)
  },
  remove(id: string): Promise<void> {
    return api.delete(`/vehicles/${id}`).then(() => undefined)
  },
}
