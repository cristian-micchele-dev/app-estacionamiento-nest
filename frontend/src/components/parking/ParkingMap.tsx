import { useMemo, useState } from 'react'
import { Car } from 'lucide-react'
import type { SpaceApi } from '@/services/spaces.service'
import type { ParkingSessionApi } from '@/services/parking.service'

interface ParkingMapProps {
  spaces: SpaceApi[]
  sessions: ParkingSessionApi[]
}

const STATUS_CONFIG = {
  available:   { bg: 'var(--space-available-bg)',   border: 'var(--space-available-border)',   text: 'var(--space-available-text)',   dot: 'var(--space-available-dot)',   label: 'Disponible' },
  occupied:    { bg: 'var(--space-occupied-bg)',    border: 'var(--space-occupied-border)',    text: 'var(--space-occupied-text)',    dot: 'var(--space-occupied-dot)',    label: 'Ocupado'    },
  reserved:    { bg: 'var(--space-selected-bg)',    border: 'var(--space-selected-border)',    text: 'var(--space-selected-text)',    dot: 'var(--space-selected-dot)',    label: 'Abono'      },
  maintenance: { bg: 'var(--space-maintenance-bg)', border: 'var(--space-maintenance-border)', text: 'var(--space-maintenance-text)', dot: 'var(--space-maintenance-dot)', label: 'Mant.'      },
}


const SECTION_LABEL_MAP: Record<string, string> = {
  M: 'F',
}

function getSectionKey(code: string): string {
  return code.replace(/\d+/g, '').toUpperCase()
}

function getSectionLabel(key: string): string {
  return SECTION_LABEL_MAP[key] ?? key
}

function getSpaceNumber(code: string): number {
  return parseInt(code.replace(/\D/g, ''), 10) || 0
}

export default function ParkingMap({ spaces, sessions }: ParkingMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Map spaceCode → plate for quick lookup
  const plateByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sessions) {
      if (s.space?.code) map.set(s.space.code, s.vehicle.plate)
    }
    return map
  }, [sessions])

  // Group and sort spaces by section
  const sections = useMemo(() => {
    const map = new Map<string, SpaceApi[]>()
    for (const space of spaces) {
      const key = getSectionKey(space.code)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(space)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => getSpaceNumber(a.code) - getSpaceNumber(b.code))
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [spaces])

  const occupied    = spaces.filter(s => s.status === 'OCCUPIED').length
  const available   = spaces.filter(s => s.status === 'AVAILABLE').length
  const maintenance = spaces.filter(s => s.status === 'MAINTENANCE').length
  const occupancy   = spaces.length > 0 ? Math.round((occupied / spaces.length) * 100) : 0

  if (spaces.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-sm" style={{ color: 'var(--text-muted)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        No hay espacios configurados.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-field)' }}>
        <div className="flex items-center gap-2">
          <Car size={15} style={{ color: 'var(--text-hint)' }} />
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-heading)' }}>Mapa de playa</h2>
        </div>
        <div className="flex items-center gap-4">
          <LegendItem color={STATUS_CONFIG.available.dot}  label="Disponible" count={available}   />
          <LegendItem color={STATUS_CONFIG.occupied.dot}   label="Ocupado"    count={occupied}    />
          {maintenance > 0 && <LegendItem color={STATUS_CONFIG.maintenance.dot} label="Mant." count={maintenance} />}
        </div>
      </div>

      {/* Map */}
      <div className="p-5 flex flex-col gap-4 items-center">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ color: '#3B82F6', background: 'var(--icon-bg-blue)' }}
          >
            ↑ ENTRADA
          </span>
        </div>

        {sections.map(([key, sectionSpaces]) => (
          <div key={key} className="flex items-start gap-3">
            {/* Section label */}
            <div
              className="shrink-0 flex items-center justify-center rounded-md text-[11px] font-bold"
              style={{ width: 32, height: 80, background: 'var(--space-section-bg)', color: 'var(--space-section-text)', letterSpacing: 1 }}
            >
              {getSectionLabel(key)}
            </div>

            {/* Space cards */}
            <div className="flex gap-2 flex-wrap">
              {sectionSpaces.map(space => {
                const plate = plateByCode.get(space.code)
                const cfgKey = space.status === 'OCCUPIED'
                  ? 'occupied'
                  : space.status === 'MAINTENANCE'
                  ? 'maintenance'
                  : 'available'
                const cfg = STATUS_CONFIG[cfgKey]
                const isHovered = hoveredId === space.id

                return (
                  <div
                    key={space.id}
                    className="relative flex flex-col justify-between rounded-md cursor-default select-none transition-all duration-150"
                    style={{
                      width: 80,
                      height: 80,
                      background: cfg.bg,
                      border: `2px solid ${isHovered ? cfg.dot : cfg.border}`,
                      padding: '8px 10px',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1,
                      boxShadow: isHovered ? `0 4px 14px ${cfg.border}90` : 'none',
                    }}
                    onMouseEnter={() => setHoveredId(space.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span
                      className="text-[11px] font-bold tracking-wide"
                      style={{ color: cfg.text, opacity: 0.65 }}
                    >
                      {space.code}
                    </span>

                    {plate ? (
                      <span
                        className="text-[11px] font-bold tracking-widest leading-none"
                        style={{ fontFamily: 'JetBrains Mono, monospace', color: cfg.text }}
                      >
                        {plate}
                      </span>
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ background: cfg.dot, opacity: 0.85 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ color: '#EF4444', background: 'var(--icon-bg-red)' }}
          >
            ↓ SALIDA
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border-field)' }}>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Total: <strong style={{ color: 'var(--text-secondary)' }}>{spaces.length} espacios</strong>
        </span>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Ocupación: <strong style={{ color: 'var(--text-heading)' }}>{occupancy}%</strong>
        </span>
      </div>
    </div>
  )
}

function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[12px]" style={{ color: 'var(--text-hint)' }}>{label}</span>
      <span
        className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: 'var(--space-section-bg)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {count}
      </span>
    </div>
  )
}
