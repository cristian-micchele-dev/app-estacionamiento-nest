import { createBrowserRouter } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ParkingPage from '@/pages/ParkingPage'
import VehiclesPage from '@/pages/VehiclesPage'
import TariffsPage from '@/pages/TariffsPage'
import ShiftsPage from '@/pages/ShiftsPage'
import TicketsPage from '@/pages/TicketsPage'
import MonthlyPassesPage from '@/pages/MonthlyPassesPage'
import UsersPage from '@/pages/UsersPage'
import AuditPage from '@/pages/AuditPage'
import ReportsPage from '@/pages/ReportsPage'
import ProfilePage from '@/pages/ProfilePage'

const ADMIN_SUPERVISOR = ['ADMIN', 'SUPERVISOR']
const ADMIN_ONLY = ['ADMIN']

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'parking',        element: <ParkingPage /> },
      { path: 'vehicles',       element: <VehiclesPage /> },
      { path: 'tickets',        element: <TicketsPage /> },
      { path: 'shifts',         element: <ShiftsPage /> },
      { path: 'monthly-passes', element: <MonthlyPassesPage /> },
      {
        path: 'tariffs',
        element: (
          <RoleProtectedRoute roles={ADMIN_SUPERVISOR}>
            <TariffsPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleProtectedRoute roles={ADMIN_ONLY}>
            <UsersPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'audit',
        element: (
          <RoleProtectedRoute roles={ADMIN_ONLY}>
            <AuditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'reports',
        element: (
          <RoleProtectedRoute roles={ADMIN_SUPERVISOR}>
            <ReportsPage />
          </RoleProtectedRoute>
        ),
      },
    ],
  },
])
