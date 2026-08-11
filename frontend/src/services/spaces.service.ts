import api from '@/lib/axios'

export type SpaceType   = 'CAR' | 'MOTORCYCLE' | 'DISABLED'
export type SpaceStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'

export interface SpaceApi {
  id: string
  code: string
  type: SpaceType
  status: SpaceStatus
}

export const spacesService = {
  findAll(): Promise<SpaceApi[]> {
    return api.get('/spaces').then(r => r.data)
  },
}
