import { useState, useEffect, useMemo } from 'react'
import { LogIn, LogOut, Car, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EntryModal from '@/components/parking/EntryModal'
import ExitModal, { type SessionForExit } from '@/components/parking/ExitModal'
import { VEHICLE_TYPE_LABEL, PAYMENT_METHOD_LABEL, formatElapsed, formatTime } from '@/data/parking.data'
import { formatDuration } from '@/lib/time'
import { parkingService, type ParkingSessionApi, type ParkingStats } from '@/services/parking.service'
import { tariffsService, type TariffApi } from '@/services/tariffs.service'
import { printEntryTicket } from '@/lib/printTicket'
import { useToast } from '@/contexts/ToastContext'
import { useParkingEvents } from '@/hooks/useParkingEvents'

function getElapsedMinutes(entryTime: Date): number {
  return Math.floor((Date.now() - entryTime.getTime()) / 60000)
}

function getTimeClasses(minutes: number): { text: string; dot: string } {
  if (minutes < 120) return { text: 'text-green-500',  dot: 'bg-green-500' }
  if (minutes < 240) return { text: 'text-signal',  dot: 'bg-signal' }
  return                     { text: 'text-red-500',   dot: 'bg-red-500'   }
}

function calcEstimated(session: ParkingSessionApi): number {
  const minutes = getElapsedMinutes(new Date(session.entryTime))
  if (minutes <= session.tariff.toleranceMinutes) return 0
  const hours = minutes / 60
  let amount = Math.round(hours * Number(session.tariff.pricePerHour))
  if (session.tariff.dailyMax !== null && amount > Number(session.tariff.dailyMax)) {
    amount = Number(session.tariff.dailyMax)
  }
  return amount
}

const PARKING_COLS = 8

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: PARKING_COLS }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3 rounded-full animate-pulse bg-slate-100"
                style={{ width: j === 0 ? '70%' : j === PARKING_COLS - 1 ? '30%' : '55%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

type FilterTab = 'ACTIVE' | 'COMPLETED' | 'ALL'
type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MONTHLY_PASS'

const VEHICLE_TYPE_CLASSES: Record<string, { bg: string; text: string }> = {
  CAR:        { bg: 'bg-blue-50',    text: 'text-blue-500'   },
  MOTORCYCLE: { bg: 'bg-fuchsia-50', text: 'text-purple-500' },
  TRUCK:      { bg: 'bg-orange-50',  text: 'text-orange-500' },
  VAN:        { bg: 'bg-green-50',   text: 'text-green-500'  },
}

const PAYMENT_CLASSES: Record<string, { bg: string; text: string }> = {
  CASH:         { bg: 'bg-green-50',  text: 'text-green-700'  },
  CARD:         { bg: 'bg-blue-50',   text: 'text-blue-500'   },
  TRANSFER:     { bg: 'bg-violet-50', text: 'text-violet-600' },
  MONTHLY_PASS: { bg: 'bg-signal/10',  text: 'text-signal-dark'  },
}

const STAT_CARDS = (
  stats: ParkingStats | null,
  activeSessions: ParkingSessionApi[],
  todayCompleted: ParkingSessionApi[],
) => [
  {
    icon: Car,
    label: 'Activas ahora',
    value: stats?.activeCount ?? activeSessions.length,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
  },
  {
    icon: Clock,
    label: 'Tiempo promedio',
    value: stats ? formatDuration(stats.avgDurationMinutes) : '—',
    iconClass: 'text-signal',
    bgClass: 'bg-signal/10',
  },
  {
    icon: CheckCircle,
    label: 'Completadas hoy',
    value: stats?.completedToday ?? todayCompleted.length,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-50',
  },
  {
    icon: TrendingUp,
    label: 'Ingresos hoy',
    value: stats
      ? `$${stats.revenueToday.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
      : '—',
    iconClass: 'text-violet-500',
    bgClass: 'bg-violet-50',
  },
]

function useNow(intervalMs = 30000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}

function toSessionForExit(s: ParkingSessionApi): SessionForExit {
  return {
    id: s.id,
    plate: s.vehicle.plate,
    vehicleType: s.vehicle.type,
    ticketNumber: s.ticketNumber,
    entryTime: new Date(s.entryTime),
    tariffName: s.tariff?.name ?? '—',
    pricePerHour: Number(s.tariff.pricePerHour),
    toleranceMinutes: s.tariff.toleranceMinutes,
  }
}

export default function ParkingPage() {
  useNow()
  const [sessions, setSessions] = useState<ParkingSessionApi[]>([])
  const [stats, setStats] = useState<ParkingStats | null>(null)
  const [tariffs, setTariffs] = useState<TariffApi[]>([])
  const [tab, setTab] = useState<FilterTab>('ACTIVE')
  const [entryOpen, setEntryOpen] = useState(false)
  const [exitSession, setExitSession] = useState<ParkingSessionApi | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  function refetch() {
    parkingService.findAll().then(setSessions)
    parkingService.getStats().then(setStats)
  }

  useEffect(() => {
    Promise.all([
      parkingService.findAll(),
      parkingService.getStats(),
      tariffsService.findAll(true),
    ]).then(([s, st, t]) => {
      setSessions(s)
      setStats(st)
      setTariffs(t)
    }).finally(() => setLoading(false))
  }, [])

  useParkingEvents(refetch)

  const activeSessions  = useMemo(() => sessions.filter(s => s.status === 'ACTIVE'),    [sessions])
  const todayCompleted  = useMemo(() => sessions.filter(s => s.status === 'COMPLETED'), [sessions])

  const filtered = useMemo(() => {
    if (tab === 'ACTIVE')    return sessions.filter(s => s.status === 'ACTIVE')
    if (tab === 'COMPLETED') return sessions.filter(s => s.status === 'COMPLETED')
    return sessions
  }, [sessions, tab])

  async function handleEntry(data: {
    plate: string; vehicleType: string; tariffId: string; spaceCode: string; notes: string
  }) {
    const session = await parkingService.createEntry(data)
    setSessions(prev => [session, ...prev])
    parkingService.getStats().then(setStats)
    toast.success('Entrada registrada')
    printEntryTicket({
      ticketNumber: session.ticketNumber,
      plate: session.vehicle.plate,
      vehicleType: session.vehicle.type,
      tariffName: session.tariff?.name ?? '—',
      entryTime: new Date(session.entryTime),
      spaceCode: session.space?.code,
      cashierName: session.entryBy?.name ?? '—',
    })
  }

  async function handleExit(sessionId: string, paymentMethod: PaymentMethod, receivedAmount?: number) {
    await parkingService.processExit(sessionId, { paymentMethod, receivedAmount })
    toast.success('Salida registrada')
    const [updated, updatedStats] = await Promise.all([
      parkingService.findAll(),
      parkingService.getStats(),
    ])
    setSessions(updated)
    setStats(updatedStats)
    setExitSession(null)
  }

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ACTIVE',    label: 'Activas',     count: activeSessions.length },
    { key: 'COMPLETED', label: 'Completadas', count: todayCompleted.length },
    { key: 'ALL',       label: 'Todas',       count: sessions.length },
  ]

  const statCards = STAT_CARDS(stats, activeSessions, todayCompleted)

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Estacionamiento</h1>
          <p className="text-sm mt-0.5 text-slate-400">Registro de entradas y salidas</p>
        </div>
        <Button
          onClick={() => setEntryOpen(true)}
          className="gap-2 font-semibold bg-blue-500 hover:bg-blue-600"
        >
          <LogIn size={15} />
          Registrar Entrada
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, iconClass, bgClass }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${bgClass}`}>
              <Icon size={16} className={iconClass} strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-mono text-[18px] font-bold leading-none text-ink">{value}</p>
              <p className="text-[11px] mt-1 text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm">

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-slate-100">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-t-lg transition-colors relative"
              style={{
                color: tab === key ? 'var(--text-heading)' : undefined,
                borderBottom: tab === key ? '2px solid #3B82F6' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <span className={tab === key ? 'text-ink' : 'text-slate-400'}>{label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                  tab === key
                    ? 'bg-blue-50 text-blue-500'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Ticket', 'Patente', 'Tipo', 'Entrada', tab !== 'COMPLETED' ? 'Tiempo' : 'Salida', 'Tarifa', 'Operador', ''].map(col => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonRows />}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-slate-300">
                    No hay sesiones
                  </td>
                </tr>
              )}
              {filtered.map(session => {
                const typeStyle = VEHICLE_TYPE_CLASSES[session.vehicle.type] ?? VEHICLE_TYPE_CLASSES.CAR
                const isActive  = session.status === 'ACTIVE'
                const entryTime = new Date(session.entryTime)

                return (
                  <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[12px] font-semibold text-slate-500">
                        {session.ticketNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[14px] font-bold tracking-widest text-ink">
                        {session.vehicle.plate}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                        {VEHICLE_TYPE_LABEL[session.vehicle.type as keyof typeof VEHICLE_TYPE_LABEL] ?? session.vehicle.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] text-slate-600">
                        {formatTime(entryTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isActive ? (() => {
                        const mins = getElapsedMinutes(entryTime)
                        const { text, dot } = getTimeClasses(mins)
                        return (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dot}`} />
                            <span className={`font-mono text-[13px] font-semibold ${text}`}>
                              {formatElapsed(entryTime)}
                            </span>
                          </div>
                        )
                      })() : (
                        <span className="font-mono text-[13px] text-slate-600">
                          {session.exitTime ? formatTime(new Date(session.exitTime)) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-slate-500">{session.tariff?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-slate-400">{session.entryBy?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isActive && (
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-mono text-[11px] font-semibold text-slate-400">
                            ~${calcEstimated(session).toLocaleString('es-AR')}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-[12px] font-semibold h-7 border-red-300 text-red-500 hover:bg-red-50"
                            onClick={() => setExitSession(session)}
                          >
                            <LogOut size={12} />
                            Salida
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EntryModal
        open={entryOpen}
        tariffs={tariffs}
        onClose={() => setEntryOpen(false)}
        onConfirm={handleEntry}
      />
      <ExitModal
        open={exitSession !== null}
        session={exitSession ? toSessionForExit(exitSession) : null}
        onClose={() => setExitSession(null)}
        onConfirm={handleExit}
      />
    </div>
  )
}
