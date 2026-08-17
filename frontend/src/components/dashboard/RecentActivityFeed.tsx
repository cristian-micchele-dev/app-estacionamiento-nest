import { LogIn, LogOut, ArrowRight } from 'lucide-react'
import { type ParkingSessionApi } from '@/services/parking.service'
import { elapsed, relativeTime } from '@/lib/time'

interface Props {
  sessions: ParkingSessionApi[]
  loading: boolean
  onViewAll: () => void
}

export default function RecentActivityFeed({ sessions, loading, onViewAll }: Props) {
  const activeNow = [...sessions]
    .filter(s => s.status === 'ACTIVE')
    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())

  const recentCompleted = [...sessions]
    .filter(s => s.status === 'COMPLETED' && s.exitTime)
    .sort((a, b) => new Date(b.exitTime!).getTime() - new Date(a.exitTime!).getTime())
    .slice(0, 12)

  const isEmpty = !loading && activeNow.length === 0 && recentCompleted.length === 0

  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <p className="text-[14px] font-semibold text-ink">Actividad reciente</p>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[12px] font-semibold text-blue-500 hover:opacity-70 transition-opacity"
        >
          Ver todo <ArrowRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-300">Cargando...</div>
      ) : isEmpty ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-300">
          Sin actividad registrada
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[380px]">

          {activeNow.length > 0 && (
            <>
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">
                  En playa · {activeNow.length}
                </span>
              </div>
              {activeNow.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-50' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse bg-green-500" />
                  <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 bg-blue-50">
                    <LogIn size={11} className="text-blue-500" />
                  </div>
                  <span className="font-mono text-[13px] font-bold text-ink tracking-[0.06em] w-20 shrink-0">
                    {s.vehicle?.plate ?? '—'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-300 w-[110px] shrink-0">
                    {s.ticketNumber}
                  </span>
                  <span className="text-[12px] flex-1 text-slate-500">{s.tariff?.name ?? '—'}</span>
                  <span className="text-[12px] shrink-0 text-slate-400">{s.entryBy?.name ?? '—'}</span>
                  <span className="font-mono text-[12px] text-signal font-semibold shrink-0 w-16 text-right">
                    {elapsed(s.entryTime)}
                  </span>
                </div>
              ))}
            </>
          )}

          {recentCompleted.length > 0 && (
            <>
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Completadas
                </span>
              </div>
              {recentCompleted.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-50' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-300" />
                  <div className="flex items-center justify-center w-6 h-6 rounded-md shrink-0 bg-green-50">
                    <LogOut size={11} className="text-green-500" />
                  </div>
                  <span className="font-mono text-[13px] font-bold text-ink tracking-[0.06em] w-20 shrink-0">
                    {s.vehicle?.plate ?? '—'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-300 w-[110px] shrink-0">
                    {s.ticketNumber}
                  </span>
                  <span className="text-[12px] flex-1 text-slate-500">{s.tariff?.name ?? '—'}</span>
                  <span className="text-[12px] shrink-0 text-slate-400">{s.entryBy?.name ?? '—'}</span>
                  <span className="font-mono text-[12px] text-slate-400 shrink-0 w-[110px] text-right">
                    {relativeTime(s.exitTime!)}
                  </span>
                </div>
              ))}
            </>
          )}

        </div>
      )}
    </div>
  )
}
