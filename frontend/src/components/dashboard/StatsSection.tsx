import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, BarChart2, Percent } from 'lucide-react'
import { dashboardService, type DashboardPeriod, type DashboardStats, type DashboardSeriesPoint } from '@/services/dashboard.service'

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'day',   label: 'Últimos 30 días'    },
  { value: 'week',  label: 'Últimas 12 semanas' },
  { value: 'month', label: 'Últimos 12 meses'   },
]

function formatDate(isoDate: string, period: DashboardPeriod): string {
  const d = new Date(isoDate)
  if (period === 'month') {
    return d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')
  }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface BarChartProps {
  series: DashboardSeriesPoint[]
  period: DashboardPeriod
}

const BAR_H = 120 // px — altura fija del área de barras

function BarChart({ series, period }: BarChartProps) {
  const maxValue = Math.max(...series.map(p => Math.max(p.quoted, p.collected)), 1)
  const visible  = series.length > 20 ? series.slice(-20) : series

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[13px] text-slate-600">Sin datos para el período seleccionado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Legend */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1E3A5F]" />
          <span className="text-[11px] font-medium text-slate-500">Cotizado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-signal" />
          <span className="text-[11px] font-medium text-slate-500">Cobrado</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1" style={{ height: BAR_H }}>
        {visible.map((point) => {
          const quotedPx    = Math.round((point.quoted    / maxValue) * BAR_H)
          const collectedPx = Math.round((point.collected / maxValue) * BAR_H)

          return (
            <div key={point.date} className="flex flex-col items-center gap-1 flex-1 min-w-0 group h-full justify-end">
              <span className="font-mono text-[9px] text-signal opacity-0 group-hover:opacity-100 transition-opacity">
                {point.sessions}
              </span>

              <div className="flex items-end gap-px w-full">
                <div
                  className="flex-1 rounded-t-sm transition-all duration-300 bg-[#1E3A5F]"
                  style={{ height: Math.max(quotedPx, point.quoted > 0 ? 3 : 0) }}
                />
                <div
                  className="flex-1 rounded-t-sm transition-all duration-300 bg-signal"
                  style={{ height: Math.max(collectedPx, point.collected > 0 ? 3 : 0) }}
                />
              </div>

              <span className="font-mono text-[9px] text-slate-400 truncate w-full text-center">
                {formatDate(point.date, period)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type StatKpi = {
  label: string
  value: string
  sub: string
  icon: typeof BarChart2
  iconBg: string
  iconColor: string
}

const buildKpis = (loading: boolean, stats: DashboardStats | null): StatKpi[] => [
  {
    label:      'Sesiones',
    value:      loading ? '—' : String(stats?.totalSessions ?? 0),
    sub:        'en el período',
    icon:       BarChart2,
    iconBg:     'bg-sky-50',
    iconColor:  'text-cyan-600',
  },
  {
    label:      'Total cotizado',
    value:      loading ? '—' : formatCurrency(stats?.totalQuoted ?? 0),
    sub:        'según tickets',
    icon:       DollarSign,
    iconBg:     'bg-signal/10',
    iconColor:  'text-signal-dark',
  },
  {
    label:      'Total cobrado',
    value:      loading ? '—' : formatCurrency(stats?.totalCollected ?? 0),
    sub:        'pagos registrados',
    icon:       TrendingUp,
    iconBg:     'bg-green-50',
    iconColor:  'text-green-600',
  },
  {
    label:      'Tasa de cobro',
    value:      loading ? '—' : `${stats?.collectionRate ?? 0}%`,
    sub:        `ticket prom. ${loading ? '—' : formatCurrency(stats?.avgTicket ?? 0)}`,
    icon:       Percent,
    iconBg:     'bg-red-50',
    iconColor:  'text-rose-600',
  },
]

export default function StatsSection() {
  const [period, setPeriod] = useState<DashboardPeriod>('day')
  const [stats,  setStats]  = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dashboardService.getStats(period).then(setStats).finally(() => setLoading(false))
  }, [period])

  const kpis = buildKpis(loading, stats)

  return (
    <div className="flex flex-col gap-4">

      {/* Header + period selector */}
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold tracking-tight text-ink">Estadísticas</p>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                period === p.value
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="rounded-2xl p-4 bg-white shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400">
                {label}
              </p>
              <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${iconBg}`}>
                <Icon size={13} className={iconColor} />
              </div>
            </div>
            <p className="font-mono text-[22px] font-extrabold text-ink leading-none">{value}</p>
            <p className="text-[11px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-5 bg-white shadow-card h-[220px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-slate-300">Cargando...</p>
          </div>
        ) : (
          <BarChart series={stats?.series ?? []} period={period} />
        )}
      </div>
    </div>
  )
}
