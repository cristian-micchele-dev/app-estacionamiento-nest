export interface JwtPayload {
  sub: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export function parseJwt(token: string): JwtPayload {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return { sub: '', email: '', role: '' }
  }
}
