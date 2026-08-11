import { Clock } from 'lucide-react'
import { type ShiftApi } from '@/services/shifts.service'
import { elapsed, formatTime } from '@/lib/time'

interface Props {
  shift: ShiftApi | null
  loading: boolean
}

export default function ShiftStatusCard({ shift, loading }: Props) {
  return (
    <div className="rounded-2xl p-5 bg-white shadow-card flex flex-col gap-4">
      <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-400">
        Turno actual
      </p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-slate-300">Cargando...</p>
        </div>
      ) : shift ? (
        <div className="flex flex-col gap-4 flex-1">
          <span className="self-start text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 tracking-[0.08em]">
            ● ABIERTO
          </span>

          <div>
            <p className="font-mono text-[28px] font-bold text-ink leading-none">
              {formatTime(shift.openedAt)}
            </p>
            <p className="text-[12px] mt-1 text-slate-400">
              Hace {elapsed(shift.openedAt)}
            </p>
          </div>

          <div className="flex flex-col gap-0.5 pt-3 mt-auto border-t border-slate-100">
            <p className="text-[13px] font-semibold text-gray-700">
              {shift.cashier?.name ?? '—'}
            </p>
            <p className="text-[11px] text-slate-400">
              Saldo inicial: ${Number(shift.openingBalance).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100">
            <Clock size={18} className="text-slate-300" />
          </div>
          <p className="text-[13px] text-slate-400">Sin turno abierto</p>
        </div>
      )}
    </div>
  )
}
