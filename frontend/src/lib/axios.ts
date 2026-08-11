import axios from 'axios'
import { BASE_URL } from '@/lib/config'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Access token lives in memory — not in localStorage
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

// Attach token to every request
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Queue for concurrent requests that arrive while refreshing
let isRefreshing = false
let queue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function flushQueue(err: unknown, token: string | null) {
  queue.forEach(p => (err ? p.reject(err) : p.resolve(token!)))
  queue = []
}

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      )
      setAccessToken(data.accessToken)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      flushQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      setAccessToken(null)
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
