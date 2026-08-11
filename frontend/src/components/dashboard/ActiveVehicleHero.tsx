import { type ParkingSessionApi } from '@/services/parking.service'
import { pad2 } from '@/lib/time'

interface Props {
  sessions: ParkingSessionApi[]
  loading: boolean
}

export default function ActiveVehicleHero({ sessions, loading }: Props) {
  const count = sessions.length

  return (
    <div
      className="rounded-2xl flex flex-col justify-between relative overflow-hidden min-h-[200px]"
      style={{
        background: '#0D1117',
        padding: '28px 28px 24px',
        boxShadow: '0 0 0 1px rgba(232,201,60,0.08), 0 8px 40px rgba(0,0,0,0.28)',
      }}
    >
      {/* Grid overlay — asphalt lane markings */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px),' +
            'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color: '#E8C93C' }}>
          En playa ahora
        </p>
        {!loading && count > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: '#1E3A52' }}>LIVE</span>
          </span>
        )}
      </div>

      {/* Counter + plates */}
      <div className="relative z-10 flex items-end justify-between mt-auto pt-4">

        {/* Left — big number */}
        <div className="flex flex-col leading-none">
          <p
            className="font-mono font-extrabold leading-none tracking-[-0.03em]"
            style={{ fontSize: 82, color: '#E8C93C', lineHeight: 1 }}
          >
            {loading ? '──' : pad2(count)}
          </p>
          <p
            className="font-mono text-[10px] font-bold tracking-[0.18em] mt-2.5 uppercase"
            style={{ color: '#1E3A52' }}
          >
            {loading ? '' : count === 1 ? 'vehículo' : 'vehículos'}
          </p>
        </div>

        {/* Right — plate list or empty state */}
        <div className="flex flex-col items-end gap-1.5 pb-0.5">
          {count === 0 && !loading && (
            <p className="text-[12px] font-medium" style={{ color: '#1A2535' }}>
              Sin vehículos
            </p>
          )}
          {sessions.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500 shrink-0" />
              <span
                className="font-mono text-[12px] tracking-[0.1em]"
                style={{ color: '#4A6280' }}
              >
                {s.vehicle?.plate ?? '—'}
              </span>
            </div>
          ))}
          {count > 5 && (
            <p className="text-[11px] font-medium" style={{ color: '#1E3A52' }}>
              +{count - 5} más
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
