import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Car,
  Clock,
  Tag,
  CreditCard,
  Users,
  ShieldCheck,
  ParkingSquare,
  Receipt,
  BarChart2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type UserRole = 'ADMIN' | 'SUPERVISOR' | 'CASHIER'

const NAV_GROUPS: { label: string | null; items: { icon: React.ElementType; label: string; href: string; roles?: UserRole[] }[] }[] = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Panel', href: '/' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { icon: Car,      label: 'Estacionamiento', href: '/parking' },
      { icon: Receipt,  label: 'Tickets',         href: '/tickets' },
      { icon: Clock,    label: 'Turnos',           href: '/shifts'  },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { icon: Tag,      label: 'Tarifas',  href: '/tariffs',        roles: ['ADMIN', 'SUPERVISOR'] },
      { icon: CreditCard, label: 'Abonos', href: '/monthly-passes'  },
      { icon: Users,    label: 'Usuarios', href: '/users',          roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { icon: BarChart2,   label: 'Reportes',  href: '/reports', roles: ['ADMIN', 'SUPERVISOR'] },
      { icon: ShieldCheck, label: 'Auditoría', href: '/audit',   roles: ['ADMIN'] },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <aside
      className={[
        'flex flex-col w-[240px] shrink-0 h-full',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out',
        'lg:static lg:translate-x-0',
        'bg-[#18191D] border-r border-white/[0.05]',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-signal">
          <ParkingSquare size={18} className="text-[#18191D]" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-semibold text-[15px] leading-tight tracking-tight">ParkAdmin</p>
          <p className="text-[12px] leading-tight text-[#3E4049]">v1.0.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(user?.role as UserRole))
          if (visibleItems.length === 0) return null
          return (
          <div key={group.label ?? 'main'} className="flex flex-col gap-0.5 pt-1">
            {group.label && (
              <p className="px-2 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#3E4049]">
                {group.label}
              </p>
            )}
            {visibleItems.map(({ icon: Icon, label, href }) => {
              const active = isActive(href)
              return (
                <NavLink
                  key={href}
                  to={href}
                  onClick={onClose}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 ${
                    active
                      ? 'text-white bg-white/[0.07]'
                      : 'text-[#7C7F8A] hover:text-[#C8CAD1] hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-signal" />
                  )}
                  <Icon
                    size={17}
                    strokeWidth={active ? 2 : 1.75}
                    className={`shrink-0 ${active ? 'text-signal' : ''}`}
                  />
                  {label}
                </NavLink>
              )
            })}
          </div>
          )
        })}
      </nav>

      {/* User profile */}
      <NavLink
        to="/profile"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.04] border-t border-white/[0.05]"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full text-[12px] font-bold shrink-0 bg-signal text-[#18191D]">
          {user?.name?.slice(0, 2).toUpperCase() ?? '??'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">{user?.name ?? '—'}</p>
          <p className="text-[11px] truncate text-[#3E4049]">{user?.role ?? '—'}</p>
        </div>
        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400" />
      </NavLink>
    </aside>
  )
}
