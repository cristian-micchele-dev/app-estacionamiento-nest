import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, ChevronRight, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import GlobalSearch from './GlobalSearch'

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Panel',
  '/parking': 'Estacionamiento',
  '/vehicles': 'Vehículos',
  '/shifts': 'Turnos',
  '/tariffs': 'Tarifas',
  '/monthly-passes': 'Abonos Mensuales',
  '/users': 'Usuarios',
  '/tickets': 'Tickets',
  '/audit': 'Auditoría',
  '/reports': 'Reportes',
  '/profile': 'Mi perfil',
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const label = ROUTE_LABELS[location.pathname] ?? 'Panel'
  const isRoot = location.pathname === '/'
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex items-center justify-between px-6 h-14 shrink-0 bg-canvas border-b border-black/[0.07] dark:border-white/[0.07]">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg mr-2 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06] text-[#6B6E78] dark:text-slate-400"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-[#9A9DA8]">ParkAdmin</span>
        {!isRoot && (
          <>
            <ChevronRight size={13} className="text-[#C5C7CE]" />
            <span className="font-semibold text-ink">{label}</span>
          </>
        )}
        {isRoot && <ChevronRight size={13} className="text-[#C5C7CE]" />}
        {isRoot && <span className="font-semibold text-ink">Panel</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Abrir búsqueda global"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors bg-black/[0.06] dark:bg-white/[0.06] text-[#6B6E78] dark:text-slate-400 hover:bg-black/[0.09] dark:hover:bg-white/[0.09]"
        >
          <Search size={14} aria-hidden="true" />
          <span className="text-xs hidden sm:block min-w-[100px]">Buscar...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] px-1 rounded bg-slate-200 text-slate-400 font-mono" aria-label="Atajo de teclado Control K">
            ⌘K
          </kbd>
        </button>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06] text-[#9A9DA8]"
        >
          {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1 bg-black/[0.1] dark:bg-white/[0.1]" />

        {/* User avatar */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold cursor-pointer bg-signal text-[#18191D]"
          title={user?.email}
        >
          {user?.name?.slice(0, 2).toUpperCase() ?? '??'}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06] text-[#9A9DA8]"
        >
          <LogOut size={15} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
