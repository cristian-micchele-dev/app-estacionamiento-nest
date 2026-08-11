import api from '@/lib/axios'

export interface UserApi {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CASHIER' | 'SUPERVISOR'
  isActive: boolean
  createdAt: string
}

export const usersService = {
  findAll(): Promise<UserApi[]> {
    return api.get('/users').then(r => r.data.data)
  },
  findOne(id: string): Promise<UserApi> {
    return api.get(`/users/${id}`).then(r => r.data)
  },
  create(data: { name: string; email: string; password: string; role?: string }): Promise<UserApi> {
    return api.post('/users', data).then(r => r.data)
  },
  update(id: string, data: Partial<{ name: string; role: string; isActive: boolean }>): Promise<UserApi> {
    return api.patch(`/users/${id}`, data).then(r => r.data)
  },
  remove(id: string): Promise<void> {
    return api.delete(`/users/${id}`).then(() => undefined)
  },
}
