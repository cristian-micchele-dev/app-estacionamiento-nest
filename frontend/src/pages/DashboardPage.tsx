import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard, Activity, RefreshCw } from 'lucide-react'
import { parkingService, type ParkingSessionApi } from '@/services/parking.service'
import { shiftsService, type ShiftApi } from '@/services/shifts.service'
import { monthlyPassesService } from '@/services/monthly-passes.service'
import { spacesService, type SpaceApi } from '@/services/spaces.service'
import { useAuth } from '@/contexts/AuthContext'
import { useParkingEvents } from '@/hooks/useParkingEvents'
import { isToday } from '@/lib/time'
import ParkingMap from '@/components/parking/ParkingMap'
import ActiveVehicleHero from '@/components/dashboard/ActiveVehicleHero'
import ShiftStatusCard from '@/components/dashboard/ShiftStatusCard'
import KpiCard from '@/components/dashboard/KpiCard'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<ParkingSessionApi[]>([])
  const [activeShift, setActiveShift] = useState<ShiftApi | null>(null)
  const [activePassesCount, setActivePassesCount] = useState(0)
  const [spaces, setSpaces] = useState<SpaceApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      parkingService.findAll(),
      shiftsService.findActive(),
      monthlyPassesService.findAll(true),
      spacesService.findAll(),
    ])
      .then(([s, sh, mp, sp]) => {
        setSessions(s)
        setActiveShift(sh)
        setActivePassesCount(mp.length)
        setSpaces(sp)
      })
      .catch(() => setError('No se pudieron cargar los datos. Intentá actualizar.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  const { connected } = useParkingEvents(fetchData)

  const activeNow = useMemo(() => sessions.filter(s => s.status === 'ACTIVE'), [sessions])
  const completedToday = useMemo(
    () => sessions.filter(s => s.status === 'COMPLETED' && s.exitTime && isToday(s.exitTime)),
    [sessions],
  )
  const todayTotal = useMemo(() => sessions.filter(s => isToday(s.entryTime)), [sessions])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] ?? 'Administrador'

  return (
    <div className="flex flex-col gap-5 min-h-full">

      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-0.5 text-slate-400">
            {now.toLocaleDateString('es-AR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/[0.09]"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {!connected && (
        <div className="px-4 py-2.5 rounded-lg text-[12px] font-semibold bg-signal/10 text-signal-dark border border-signal/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-signal-dark animate-pulse shrink-0" />
          Sin conexión en tiempo real — reconectando...
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px] bg-red-50 text-red-600 border border-red-300">
          {error}
        </div>
      )}

      {/* Hero + Shift status */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[2fr_1fr]">
        <ActiveVehicleHero sessions={activeNow} loading={loading} />
        <ShiftStatusCard shift={activeShift} loading={loading} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={CheckCircle}
          label="Completadas hoy"
          value={completedToday.length}
          sublabel="sesiones cerradas"
          variant="green"
          loading={loading}
        />
        <KpiCard
          icon={CreditCard}
          label="Abonos activos"
          value={activePassesCount}
          sublabel="vigentes este mes"
          variant="cyan"
          loading={loading}
        />
        <KpiCard
          icon={Activity}
          label="Movimiento hoy"
          value={todayTotal.length}
          sublabel="entradas registradas"
          variant="amber"
          loading={loading}
        />
      </div>

      <ParkingMap spaces={spaces} sessions={activeNow} />

      <RecentActivityFeed
        sessions={sessions}
        loading={loading}
        onViewAll={() => navigate('/parking')}
      />
    </div>
  )
}
