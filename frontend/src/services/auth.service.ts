import api from '@/lib/axios'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export const authService = {
  login(email: string, password: string): Promise<LoginResponse> {
    return api.post('/auth/login', { email, password }).then(r => r.data)
  },

  logout(): Promise<void> {
    return api.post('/auth/logout').then(() => undefined)
  },
}
