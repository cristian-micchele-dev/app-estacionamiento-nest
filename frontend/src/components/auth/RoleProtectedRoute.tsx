import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  roles: string[]
}

export default function RoleProtectedRoute({ children, roles }: Props) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
