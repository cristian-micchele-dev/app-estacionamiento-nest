import { useState, useEffect } from 'react'
import {
  Search, Receipt, ChevronLeft, ChevronRight, Printer,
  TrendingUp, Clock, CheckCircle, X, XCircle, Car, CalendarDays,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useTickets } from '@/hooks/useTickets'
import { STATUS_LABEL, STATUS_STYLE } from '@/data/ticketsData'
import { ticketsService, type TicketApi, type TicketStatus } from '@/services/tickets.service'
import { parkingService } from '@/services/parking.service'
import { printTicket } from '@/lib/printTicket'
import { fmtMoney } from '@/lib/format'
import { formatDuration } from '@/lib/time'
import { getPaginationPages } from '@/lib/pagination'
import { useToast } from '@/contexts/ToastContext'

const PAGE_SIZE = 20
const TODAY = format(new Date(), 'yyyy-MM-dd')

type StatusFilter = TicketStatus | ''

interface DayStats {
  paid: number
  pending: number
  collected: number
}

// ─── helpers ────────────────────────────────────────────────────────────────

// ─── skeleton ────────────────────────────────────────────────────────────────

const COLS = 7

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: COLS }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3 rounded-full animate-pulse bg-slate-100"
                style={{ width: j === 0 ? '80%' : j === COLS - 1 ? '40%' : '60%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── detail drawer ───────────────────────────────────────────────────────────

function DrawerField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100">
      <span className="text-[12px] font-semibold uppercase tracking-wide shrink-0 text-slate-400">
        {label}
      </span>
      <span className="text-[13px] text-right text-ink">{value}</span>
    </div>
  )
}

interface TicketDrawerProps {
  ticket: TicketApi | null
  onClose: () => void
  onCancelled: (id: string) => void
  onReprint: (ticket: TicketApi) => void
  reprinting: boolean
}

function TicketDrawer({ ticket, onClose, onCancelled, onReprint, reprinting }: TicketDrawerProps) {
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const { toast } = useToast()

  async function handleCancel() {
    if (!ticket) return
    setCancelling(true)
    setCancelOpen(false)
    try {
      await ticketsService.cancel(ticket.id)
      toast.success('Ticket cancelado')
      onCancelled(ticket.id)
    } catch {
      toast.error('No se pudo cancelar el ticket')
    } finally {
      setCancelling(false)
    }
  }

  const open        = ticket !== null
  const statusStyle = ticket ? STATUS_STYLE[ticket.status] : null
  const hasDiscount = ticket ? Number(ticket.discountAmount) > 0 : false

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-white w-[360px] transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
              <Receipt size={15} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-none text-ink">
                {ticket?.session?.ticketNumber ?? 'Detalle'}
              </p>
              <p className="text-[11px] mt-0.5 text-slate-400">
                {ticket?.session?.vehicle?.plate ?? '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 text-slate-400"
          >
            <X size={15} />
          </button>
        </div>

        {ticket && (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1">
            {statusStyle && (
              <div className="mb-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>
            )}

            <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-300">Vehículo</p>
            <DrawerField label="Patente" value={
              <span className="font-mono font-bold tracking-[0.1em]">
                {ticket.session?.vehicle?.plate ?? '—'}
              </span>
            } />
            <DrawerField label="Tipo" value={
              <span className="flex items-center gap-1.5">
                <Car size={12} className="text-slate-500" />
                {ticket.session?.vehicle?.type ?? '—'}
              </span>
            } />

            <p className="text-[11px] font-bold uppercase tracking-wider mt-3 mb-1 text-slate-300">Tiempo</p>
            <DrawerField label="Fecha"    value={format(new Date(ticket.createdAt), "dd 'de' MMMM yyyy", { locale: es })} />
            <DrawerField label="Hora"     value={format(new Date(ticket.createdAt), 'HH:mm', { locale: es })} />
            <DrawerField label="Duración" value={<span className="font-mono">{formatDuration(ticket.durationMinutes)}</span>} />

            <p className="text-[11px] font-bold uppercase tracking-wider mt-3 mb-1 text-slate-300">Montos</p>
            <DrawerField label="Subtotal" value={
              <span className="font-mono">${fmtMoney(Number(ticket.subtotal))}</span>
            } />
            {hasDiscount && (
              <DrawerField label="Descuento" value={
                <span className="font-mono text-signal-dark">-${fmtMoney(Number(ticket.discountAmount))}</span>
              } />
            )}
            <DrawerField label="Total" value={
              <span className="font-mono font-bold text-[15px] text-green-600">
                ${fmtMoney(Number(ticket.totalAmount))}
              </span>
            } />
          </div>
        )}

        {ticket && (
          <div className="px-5 py-4 flex flex-col gap-2 shrink-0 border-t border-slate-100">
            <Button variant="outline" className="w-full gap-2 text-sm font-semibold" onClick={() => onReprint(ticket)} disabled={reprinting}>
              {reprinting
                ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <Printer size={14} />}
              Reimprimir ticket
            </Button>
            {ticket.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm font-semibold border-red-300 text-red-500 hover:bg-red-50"
                  onClick={() => setCancelOpen(true)}
                  disabled={cancelling}
                >
                  {cancelling
                    ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    : <XCircle size={14} />}
                  Cancelar ticket
                </Button>

                <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar este ticket?</AlertDialogTitle>
                      <AlertDialogDescription>
                        El ticket <strong>{ticket.session?.ticketNumber}</strong> quedará anulado. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setCancelOpen(false)}>Volver</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Sí, cancelar ticket
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── stats ───────────────────────────────────────────────────────────────────

const DAY_STAT_CARDS = [
  { icon: CheckCircle, label: 'Pagados',    key: 'paid',      iconColor: 'text-green-600', iconBg: 'bg-green-50'  },
  { icon: Clock,       label: 'Pendientes', key: 'pending',   iconColor: 'text-signal-dark', iconBg: 'bg-signal/10' },
  { icon: TrendingUp,  label: 'Recaudado',  key: 'collected', iconColor: 'text-blue-500',  iconBg: 'bg-blue-50'   },
] as const

// ─── page ────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [date,           setDate]           = useState(TODAY)
  const [search,         setSearch]         = useState('')
  const [status,         setStatus]         = useState<StatusFilter>('')
  const [page,           setPage]           = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<TicketApi | null>(null)
  const [reprinting,     setReprinting]     = useState(false)
  const [dayStats,       setDayStats]       = useState<DayStats | null>(null)
  const { toast } = useToast()

  const { tickets, loading, total, totalPages, setTickets } = useTickets({
    search:   search || undefined,
    status:   status || undefined,
    dateFrom: date,
    dateTo:   date,
    page,
    limit:    PAGE_SIZE,
  })

  useEffect(() => {
    setDayStats(null)
    ticketsService.findAll({ dateFrom: date, dateTo: date, all: true }).then(res => {
      const paid    = res.data.filter(t => t.status === 'PAID')
      const pending = res.data.filter(t => t.status === 'PENDING')
      setDayStats({
        paid:      paid.length,
        pending:   pending.length,
        collected: paid.reduce((sum, t) => sum + Number(t.totalAmount), 0),
      })
    })
  }, [date])

  async function handleReprint(ticket: TicketApi) {
    setReprinting(true)
    try {
      const session = await parkingService.findOne(ticket.sessionId)
      printTicket({
        ticketNumber:    session.ticketNumber,
        plate:           session.vehicle.plate,
        vehicleType:     session.vehicle.type,
        tariffName:      session.tariff.name,
        entryTime:       session.entryTime,
        exitTime:        session.exitTime ?? new Date().toISOString(),
        durationMinutes: ticket.durationMinutes,
        subtotal:        Number(ticket.subtotal),
        discountAmount:  Number(ticket.discountAmount),
        totalAmount:     Number(ticket.totalAmount),
        cashierName:     session.exitBy?.name ?? session.entryBy.name,
        reprint:         true,
      })
    } catch {
      toast.error('No se pudo reimprimir el ticket')
    } finally {
      setReprinting(false)
    }
  }

  function handleCancelled(id: string) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'CANCELLED' as TicketStatus } : t))
    setSelectedTicket(prev => prev?.id === id ? { ...prev, status: 'CANCELLED' as TicketStatus } : prev)
    setDayStats(prev => prev ? { ...prev, pending: Math.max(0, prev.pending - 1) } : prev)
  }

  function handleDateChange(val: string) {
    setDate(val)
    setPage(1)
    setSelectedTicket(null)
  }

  function handleSearch(val: string) { setSearch(val.trim()); setPage(1) }
  function handleStatus(val: string | null) { setStatus((val ?? '') as StatusFilter); setPage(1) }
  function clearFilters() { setSearch(''); setStatus(''); setPage(1) }

  const isToday = date === TODAY
  const dateLabel = isToday
    ? 'Hoy'
    : format(new Date(date + 'T00:00:00'), "d 'de' MMM yyyy", { locale: es })

  const pages = getPaginationPages(page, totalPages)

  function getDayStatValue(key: 'paid' | 'pending' | 'collected') {
    if (!dayStats) return '—'
    if (key === 'collected') return `$${fmtMoney(dayStats.collected)}`
    return String(dayStats[key])
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Tickets</h1>
          <p className="text-sm mt-0.5 text-slate-400">Comprobantes del día</p>
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => handleDateChange(TODAY)}
              className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-slate-100 text-blue-500"
            >
              Volver a hoy
            </button>
          )}
          <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <CalendarDays size={14} className="text-slate-500" />
            <span className="text-[13px] font-semibold text-ink">{dateLabel}</span>
            <input
              type="date"
              value={date}
              max={TODAY}
              onChange={e => e.target.value && handleDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DAY_STAT_CARDS.map(({ icon: Icon, label, key, iconColor, iconBg }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-card">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconBg}`}>
              <Icon size={16} className={iconColor} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[17px] font-bold leading-none truncate text-ink">
                {getDayStatValue(key)}
              </p>
              <p className="text-[11px] mt-1 text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-card">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3.5 flex-wrap border-b border-slate-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="N° ticket, patente..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          <Select value={status} onValueChange={handleStatus}>
            <SelectTrigger className="w-36 text-sm">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="PAID">Pagado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {(search || status) && (
            <button
              onClick={clearFilters}
              className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors text-blue-500 hover:bg-blue-50"
            >
              Limpiar filtros
            </button>
          )}

          <span className="text-[12px] ml-auto text-slate-400">
            {total} ticket{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['N° Ticket', 'Patente', 'Hora', 'Duración', 'Total', 'Estado', ''].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonRows />}

              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={COLS} className="py-16 text-center text-slate-300">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt size={28} strokeWidth={1.25} />
                      <span className="text-sm">
                        {search || status
                          ? 'No hay tickets que coincidan con los filtros'
                          : `Sin tickets para el ${dateLabel.toLowerCase()}`}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && tickets.map(ticket => {
                const statusStyle = STATUS_STYLE[ticket.status]
                const hasDiscount = Number(ticket.discountAmount) > 0
                const isSelected  = selectedTicket?.id === ticket.id
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(isSelected ? null : ticket)}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-slate-50' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] font-bold tracking-wide text-ink">
                        {ticket.session?.ticketNumber ?? `#${ticket.id.slice(0, 8)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] font-bold tracking-widest text-gray-700">
                        {ticket.session?.vehicle?.plate ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] text-gray-700">
                        {format(new Date(ticket.createdAt), 'HH:mm', { locale: es })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] text-gray-700">
                        {formatDuration(ticket.durationMinutes)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[13px] font-semibold text-ink">
                        ${fmtMoney(Number(ticket.totalAmount))}
                      </span>
                      {hasDiscount && (
                        <p className="text-[11px] mt-0.5 text-signal-dark">
                          -${fmtMoney(Number(ticket.discountAmount))} dto
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                        {STATUS_LABEL[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); handleReprint(ticket) }}
                        disabled={reprinting}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-500"
                        title="Reimprimir ticket"
                      >
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-[12px] text-slate-400">Página {page} de {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500">
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
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TicketDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onCancelled={handleCancelled}
        onReprint={handleReprint}
        reprinting={reprinting}
      />
    </div>
  )
}
