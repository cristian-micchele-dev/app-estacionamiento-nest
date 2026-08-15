import { useState, useEffect } from 'react'
import { Clock, Lock, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OpenShiftModal from '@/components/shifts/OpenShiftModal'
import CloseShiftModal from '@/components/shifts/CloseShiftModal'
import { shiftsService, type ShiftApi } from '@/services/shifts.service'
import type { Shift } from '@/data/shifts.data'
import { formatCurrency } from '@/lib/format'

function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: string | Date, end: string | Date) {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = typeof end === 'string' ? new Date(end) : end
  const mins = Math.floor((e.getTime() - s.getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function DiffBadge({ diff }: { diff: number | null }) {
  if (diff === null) return <span className="text-slate-400">—</span>
  if (diff === 0) return (
    <span className="flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
      <Minus size={11} /> $0
    </span>
  )
  if (diff > 0) return (
    <span className="flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
      <TrendingUp size={11} /> +{formatCurrency(diff)}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
      <TrendingDown size={11} /> {formatCurrency(diff)}
    </span>
  )
}

function toMockShift(s: ShiftApi): Shift {
  return {
    id: s.id,
    cashier: s.cashier.name,
    openedAt: new Date(s.openedAt),
    closedAt: s.closedAt ? new Date(s.closedAt) : null,
    openingBalance: Number(s.openingBalance),
    closingBalanceCounted: s.closingBalanceCounted !== null ? Number(s.closingBalanceCounted) : null,
    closingBalanceSystem: s.closingBalanceSystem !== null ? Number(s.closingBalanceSystem) : null,
    difference: s.difference !== null ? Number(s.difference) : null,
    status: s.status,
    notes: s.notes,
    payments: { cash: 0, card: 0, transfer: 0, monthlyPass: 0 },
  }
}

const SHIFTS_PER_PAGE = 10

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftApi[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyPage, setHistoryPage] = useState(1)

  useEffect(() => {
    shiftsService.findAll().then(setShifts).finally(() => setLoading(false))
  }, [])

  const activeShift  = shifts.find(s => s.status === 'OPEN') ?? null
  const closedShifts = shifts.filter(s => s.status === 'CLOSED').sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
  const totalHistoryPages = Math.ceil(closedShifts.length / SHIFTS_PER_PAGE)
  const pagedShifts = closedShifts.slice((historyPage - 1) * SHIFTS_PER_PAGE, historyPage * SHIFTS_PER_PAGE)

  async function handleOpenShift(openingBalance: number) {
    const shift = await shiftsService.open(openingBalance)
    setShifts(prev => [shift, ...prev])
  }

  async function handleCloseShift(closingBalance: number, notes: string) {
    if (!activeShift) return
    const closed = await shiftsService.close(activeShift.id, closingBalance, notes)
    setShifts(prev => prev.map(s => s.id === closed.id ? closed : s))
    setCloseModal(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Turnos</h1>
          <p className="text-sm mt-0.5 text-slate-400">Apertura y cierre de caja por operador</p>
        </div>
        {!activeShift && (
          <Button onClick={() => setOpenModal(true)} className="gap-2 font-semibold bg-green-500 hover:bg-green-600">
            <Clock size={15} />
            Abrir Turno
          </Button>
        )}
      </div>

      {/* Active shift card */}
      {loading ? (
        <div className="rounded-xl p-8 text-center text-[13px] bg-slate-50 text-slate-400">Cargando...</div>
      ) : activeShift ? (
        <div className="rounded-xl p-5 flex flex-col gap-4 bg-ink shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/15">
                <Clock size={18} className="text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[16px] font-bold text-slate-50">Turno activo</p>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    EN CURSO
                  </span>
                </div>
                <p className="text-[12px] mt-0.5 text-slate-500">
                  {activeShift.cashier.name} · Apertura {formatDate(activeShift.openedAt)}
                </p>
              </div>
            </div>
            <Button onClick={() => setCloseModal(true)} size="sm" className="gap-1.5 font-semibold bg-red-500 hover:bg-red-600">
              <Lock size={13} />
              Cerrar
            </Button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Saldo inicial</p>
              <p className="font-mono text-[15px] font-bold mt-0.5 text-slate-400">
                {formatCurrency(activeShift.openingBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Estado</p>
              <p className="text-[15px] font-bold mt-0.5 text-green-500">Abierto</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-slate-50 border-2 border-dashed border-slate-200">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100">
            <Clock size={22} className="text-slate-400" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-700">No hay turno activo</p>
            <p className="text-[13px] mt-0.5 text-slate-400">Abrí un turno para comenzar a registrar cobros</p>
          </div>
          <Button onClick={() => setOpenModal(true)} className="gap-2 mt-1 font-semibold bg-green-500 hover:bg-green-600">
            <Clock size={14} />
            Abrir Turno
          </Button>
        </div>
      )}

      {/* History */}
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Historial de turnos</p>

        {closedShifts.length === 0 ? (
          <p className="text-[13px] text-slate-400">Sin turnos cerrados aún.</p>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Operador', 'Apertura', 'Cierre', 'Duración', 'Saldo sistema', 'Diferencia', 'Notas'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedShifts.map((shift, i) => (
                  <tr key={shift.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-semibold text-ink">{shift.cashier.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{formatDate(shift.openedAt)}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{shift.closedAt ? formatDate(shift.closedAt) : '—'}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">
                      {shift.closedAt ? formatDuration(shift.openedAt, shift.closedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-gray-700">
                      {shift.closingBalanceSystem !== null ? formatCurrency(shift.closingBalanceSystem) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <DiffBadge diff={shift.difference !== null ? Number(shift.difference) : null} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400">{shift.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <span className="text-[12px] text-slate-400">
                  Página {historyPage} de {totalHistoryPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryPage(p => p - 1)}
                    disabled={historyPage === 1}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setHistoryPage(p => p + 1)}
                    disabled={historyPage === totalHistoryPages}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <OpenShiftModal open={openModal} onClose={() => setOpenModal(false)} onConfirm={handleOpenShift} />
      <CloseShiftModal
        open={closeModal}
        shift={activeShift ? toMockShift(activeShift) : null}
        onClose={() => setCloseModal(false)}
        onConfirm={handleCloseShift}
      />
    </div>
  )
}
