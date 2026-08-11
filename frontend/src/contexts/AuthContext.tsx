import { createContext, useContext, useEffect, useState } from 'react'
import { setAccessToken } from '@/lib/axios'
import { parseJwt } from '@/lib/jwt'
import { authService } from '@/services/auth.service'
import { usersService, type UserApi } from '@/services/users.service'
import { BASE_URL } from '@/lib/config'
import axios from 'axios'

interface AuthContextType {
  user: UserApi | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Try to restore session on mount
  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      setIsLoading(false)
      return
    }

    axios
      .post(`${BASE_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      })
      .then(async ({ data }) => {
        setAccessToken(data.accessToken)
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
        const { sub } = parseJwt(data.accessToken)
        const profile = await usersService.findOne(sub)
        setUser(profile)
      })
      .catch(() => {
        localStorage.removeItem('refreshToken')
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { accessToken, refreshToken } = await authService.login(email, password)
    setAccessToken(accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const { sub } = parseJwt(accessToken)
    const profile = await usersService.findOne(sub)
    setUser(profile)
  }

  async function refreshProfile() {
    if (!user) return
    const profile = await usersService.findOne(user.id)
    setUser(profile)
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      setAccessToken(null)
      localStorage.removeItem('refreshToken')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
