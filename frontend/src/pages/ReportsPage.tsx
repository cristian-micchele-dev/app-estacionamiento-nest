import { useState, useEffect, useCallback, useMemo } from 'react'
import { Download, Printer, FileText, TrendingUp, Receipt, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ticketsService, type TicketApi } from '@/services/tickets.service'
import { exportCsv } from '@/lib/exportCsv'
import { printReport } from '@/lib/printReport'
import { fmtMoney } from '@/lib/format'
import { formatDuration } from '@/lib/time'
import { getPaginationPages } from '@/lib/pagination'
import { useToast } from '@/contexts/ToastContext'
import { STATUS_LABEL, STATUS_STYLE } from '@/data/ticketsData'
import { format, startOfMonth, startOfWeek, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── helpers ─────────────────────────────────────────────────────────────────

function toInputDate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtDateLabel(iso: string): string {
  return format(new Date(iso + 'T00:00:00'), "EEEE d 'de' MMM", { locale: es })
}

// ─── constants ────────────────────────────────────────────────────────────────

const today        = new Date()
const DEFAULT_FROM = toInputDate(startOfMonth(today))
const DEFAULT_TO   = toInputDate(today)
const PAGE_SIZE    = 20

type Preset = 'today' | 'week' | 'month' | 'prev-month' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today',      label: 'Hoy' },
  { key: 'week',       label: 'Esta semana' },
  { key: 'month',      label: 'Este mes' },
  { key: 'prev-month', label: 'Mes anterior' },
]


// ─── stat cards ──────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { label: 'Total tickets',            key: 'tickets',   icon: Receipt,    iconColor: 'text-blue-500',   iconBg: 'bg-blue-50'   },
  { label: 'Total recaudado',          key: 'collected', icon: TrendingUp, iconColor: 'text-green-600',  iconBg: 'bg-green-50'  },
  { label: 'Ticket promedio',          key: 'avg',       icon: TrendingUp, iconColor: 'text-signal-dark', iconBg: 'bg-signal/10' },
  { label: 'Pagados / Pend. / Cancel.', key: 'status',   icon: XCircle,    iconColor: 'text-violet-500', iconBg: 'bg-violet-50' },
] as const

// ─── page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(DEFAULT_FROM)
  const [dateTo,   setDateTo]   = useState(DEFAULT_TO)
  const [preset,   setPreset]   = useState<Preset>('month')
  const [tickets,  setTickets]  = useState<TicketApi[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)
  const { toast } = useToast()

  const generate = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setPage(1)
    try {
      const res = await ticketsService.findAll({ dateFrom: from, dateTo: to, all: true })
      setTickets(res.data)
    } catch {
      toast.error('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    generate(DEFAULT_FROM, DEFAULT_TO)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(p: Preset) {
    const now = new Date()
    let from = dateFrom
    let to   = dateTo
    switch (p) {
      case 'today':
        from = to = toInputDate(now)
        break
      case 'week':
        from = toInputDate(startOfWeek(now, { weekStartsOn: 1 }))
        to   = toInputDate(now)
        break
      case 'month':
        from = toInputDate(startOfMonth(now))
        to   = toInputDate(now)
        break
      case 'prev-month': {
        const prev = subMonths(now, 1)
        from = toInputDate(startOfMonth(prev))
        to   = toInputDate(endOfMonth(prev))
        break
      }
    }
    setPreset(p)
    setDateFrom(from)
    setDateTo(to)
    generate(from, to)
  }

  function handleGenerate() {
    setPreset('custom')
    generate(dateFrom, dateTo)
  }

  function handleExportCsv() {
    if (!tickets) return
    const headers = ['N° Ticket', 'Patente', 'Fecha', 'Duración', 'Subtotal', 'Descuento', 'Total', 'Estado']
    const rows = tickets.map(t => [
      t.session?.ticketNumber ?? '',
      t.session?.vehicle?.plate ?? '',
      fmtDate(t.createdAt.slice(0, 10)),
      formatDuration(t.durationMinutes),
      Number(t.subtotal),
      Number(t.discountAmount),
      Number(t.totalAmount),
      STATUS_LABEL[t.status] ?? t.status,
    ])
    exportCsv(`reporte_${dateFrom}_${dateTo}`, headers, rows)
    toast.success('CSV descargado')
  }

  function handlePrint() {
    if (!tickets) return
    printReport(tickets, { dateFrom, dateTo })
  }

  // ─── aggregates ────────────────────────────────────────────────────────────

  const paid      = useMemo(() => tickets?.filter(t => t.status === 'PAID')      ?? [], [tickets])
  const pending   = useMemo(() => tickets?.filter(t => t.status === 'PENDING')   ?? [], [tickets])
  const cancelled = useMemo(() => tickets?.filter(t => t.status === 'CANCELLED') ?? [], [tickets])
  const collected = useMemo(() => paid.reduce((s, t) => s + Number(t.totalAmount), 0), [paid])
  const avgTicket = useMemo(() => paid.length > 0 ? collected / paid.length : 0, [paid, collected])

  const dailySummary = useMemo(() => {
    if (!tickets) return []
    const map = new Map<string, { date: string; count: number; paid: number; collected: number }>()
    tickets.forEach(t => {
      const date = t.createdAt.slice(0, 10)
      const row  = map.get(date) ?? { date, count: 0, paid: 0, collected: 0 }
      row.count++
      if (t.status === 'PAID') { row.paid++; row.collected += Number(t.totalAmount) }
      map.set(date, row)
    })
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date))
  }, [tickets])

  // ─── pagination ────────────────────────────────────────────────────────────

  const totalPages   = tickets ? Math.ceil(tickets.length / PAGE_SIZE) : 0
  const pagedTickets = tickets ? tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : []
  const pages        = getPaginationPages(page, totalPages)

  const hasData = tickets !== null

  function getStatValue(key: typeof STAT_CARDS[number]['key']) {
    if (!tickets) return '—'
    switch (key) {
      case 'tickets':   return String(tickets.length)
      case 'collected': return `$${fmtMoney(collected)}`
      case 'avg':       return `$${fmtMoney(avgTicket)}`
      case 'status':    return `${paid.length} / ${pending.length} / ${cancelled.length}`
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Reportes</h1>
          <p className="text-sm mt-0.5 text-slate-400">Exportá y analizá la información del período</p>
        </div>
        {hasData && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv} className="gap-2 text-sm font-semibold">
              <Download size={14} /> CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2 text-sm font-semibold">
              <Printer size={14} /> PDF
            </Button>
          </div>
        )}
      </div>

      {/* Filter card */}
      <div className="bg-white rounded-xl p-5 flex flex-col gap-4 shadow-card">

        {/* Preset shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                preset === p.key
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Desde</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={e => { setDateFrom(e.target.value); setPreset('custom') }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-800 font-mono outline-none dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hasta</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={toInputDate(today)}
              onChange={e => { setDateTo(e.target.value); setPreset('custom') }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-800 font-mono outline-none dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="gap-2 font-semibold bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
          >
            <FileText size={15} />
            {loading ? 'Cargando...' : 'Generar'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {hasData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ label, key, icon: Icon, iconColor, iconBg }) => (
              <div key={label} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-card">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconBg}`}>
                  <Icon size={16} className={iconColor} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[17px] font-bold leading-none truncate text-ink">
                    {getStatValue(key)}
                  </p>
                  <p className="text-[11px] mt-1 truncate text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Daily summary */}
          {dailySummary.length > 1 && (
            <div className="bg-white rounded-xl overflow-hidden shadow-card">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <p className="text-[13px] font-semibold text-gray-700">Resumen por día</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Fecha', 'Tickets', 'Pagados', 'Recaudado'].map(col => (
                        <th key={col} className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((row, i) => (
                      <tr key={row.date} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                        <td className="px-5 py-2.5">
                          <p className="text-[13px] font-semibold capitalize text-ink">{fmtDateLabel(row.date)}</p>
                          <p className="text-[11px] text-slate-400">{fmtDate(row.date)}</p>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="font-mono text-[13px] text-gray-700">{row.count}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="font-mono text-[13px] text-gray-700">{row.paid}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="font-mono text-[13px] font-semibold text-green-600">
                            ${fmtMoney(row.collected)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail table */}
          <div className="bg-white rounded-xl shadow-card">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
              <p className="text-[13px] font-semibold text-gray-700">Detalle de tickets</p>
              <span className="text-[12px] text-slate-400">{tickets!.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['N° Ticket', 'Patente', 'Fecha', 'Duración', 'Subtotal', 'Descuento', 'Total', 'Estado'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedTickets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-sm text-slate-300">
                        Sin registros para el período seleccionado
                      </td>
                    </tr>
                  )}
                  {pagedTickets.map(ticket => {
                    const statusStyle = STATUS_STYLE[ticket.status]
                    return (
                      <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] font-bold text-ink">
                            {ticket.session?.ticketNumber ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[13px] font-bold tracking-widest text-gray-700">
                            {ticket.session?.vehicle?.plate ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-gray-700">{fmtDate(ticket.createdAt.slice(0, 10))}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] text-gray-700">
                            {formatDuration(ticket.durationMinutes)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] text-gray-700">
                            ${fmtMoney(Number(ticket.subtotal))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[12px] ${Number(ticket.discountAmount) > 0 ? 'text-signal-dark' : 'text-slate-300'}`}>
                            {Number(ticket.discountAmount) > 0 ? `-$${fmtMoney(Number(ticket.discountAmount))}` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12px] font-semibold text-ink">
                            ${fmtMoney(Number(ticket.totalAmount))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            {STATUS_LABEL[ticket.status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <span className="text-[12px] text-slate-400">Página {page} de {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {pages.map((p, i) =>
                    p === '...'
                      ? <span key={`e-${i}`} className="w-7 text-center text-[12px] text-slate-300">···</span>
                      : <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-semibold transition-colors ${
                            p === page ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                  )}
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Loading state (initial) */}
      {loading && !hasData && (
        <div className="flex items-center justify-center py-20 text-slate-300">
          <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  )
}
