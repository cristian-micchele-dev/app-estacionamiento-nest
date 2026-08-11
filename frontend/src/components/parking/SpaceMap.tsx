import { useMemo } from 'react'
import type { SpaceApi } from '@/services/spaces.service'

interface SpaceMapProps {
  spaces: SpaceApi[]
  vehicleType: string
  selected: string
  onSelect: (code: string) => void
}

const COMPATIBLE_SPACE_TYPES: Record<string, string[]> = {
  CAR:        ['CAR', 'DISABLED'],
  VAN:        ['CAR', 'DISABLED'],
  TRUCK:      ['CAR'],
  BUS:        ['CAR'],
  MOTORCYCLE: ['MOTORCYCLE'],
}

const STATUS_CONFIG = {
  available:   { bg: 'var(--space-available-bg)',   border: 'var(--space-available-border)',   text: 'var(--space-available-text)',   dot: 'var(--space-available-dot)'   },
  occupied:    { bg: 'var(--space-occupied-bg)',    border: 'var(--space-occupied-border)',    text: 'var(--space-occupied-text)',    dot: 'var(--space-occupied-dot)'    },
  selected:    { bg: 'var(--space-selected-bg)',    border: 'var(--space-selected-border)',    text: 'var(--space-selected-text)',    dot: 'var(--space-selected-dot)'    },
  disabled:    { bg: 'var(--space-disabled-bg)',    border: 'var(--space-disabled-border)',    text: 'var(--space-disabled-text)',    dot: 'var(--space-disabled-dot)'    },
  maintenance: { bg: 'var(--space-maintenance-bg)', border: 'var(--space-maintenance-border)', text: 'var(--space-maintenance-text)', dot: 'var(--space-maintenance-dot)' },
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


export default function SpaceMap({ spaces, vehicleType, selected, onSelect }: SpaceMapProps) {
  const compatible = COMPATIBLE_SPACE_TYPES[vehicleType] ?? ['CAR']

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

  if (spaces.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg py-8 text-[13px]"
        style={{ background: 'var(--space-disabled-bg)', color: 'var(--space-disabled-text)', border: '1px solid var(--space-disabled-border)' }}
      >
        Cargando mapa...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map(([key, sectionSpaces]) => (
        <div key={key} className="flex items-start gap-2">
          {/* Row label */}
          <div
            className="shrink-0 flex items-center justify-center rounded-md text-[11px] font-bold"
            style={{
              width: 28,
              height: 80,
              background: 'var(--space-section-bg)',
              color: 'var(--space-section-text)',
              letterSpacing: 1,
            }}
          >
            {getSectionLabel(key)}
          </div>

          {/* Spaces */}
          <div className="flex gap-2 flex-wrap">
            {sectionSpaces.map(space => {
              const isSelected   = space.code === selected
              const isCompatible = compatible.includes(space.type)
              const isAvailable  = space.status === 'AVAILABLE'
              const isOccupied   = space.status === 'OCCUPIED'
              const isMaintenance = space.status === 'MAINTENANCE'
              const isClickable  = isAvailable && isCompatible

              const cfg = isSelected
                ? STATUS_CONFIG.selected
                : isOccupied
                ? STATUS_CONFIG.occupied
                : isMaintenance
                ? STATUS_CONFIG.maintenance
                : isAvailable && isCompatible
                ? STATUS_CONFIG.available
                : STATUS_CONFIG.disabled

              return (
                <button
                  key={space.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => onSelect(space.code)}
                  title={
                    isOccupied    ? 'Ocupado'                            :
                    isMaintenance ? 'En mantenimiento'                    :
                    !isCompatible ? 'No compatible con este tipo de vehículo' :
                    undefined
                  }
                  className="relative flex flex-col justify-between rounded-md select-none transition-all duration-150"
                  style={{
                    width: 64,
                    height: 80,
                    background: cfg.bg,
                    border: `2px solid ${cfg.border}`,
                    padding: '8px 10px',
                    cursor: isClickable ? 'pointer' : 'not-allowed',
                    opacity: isAvailable && !isCompatible ? 0.4 : 1,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    zIndex: isSelected ? 10 : 1,
                    boxShadow: isSelected ? `0 4px 14px ${cfg.border}90` : 'none',
                  }}
                >
                  <span
                    className="text-[11px] font-bold tracking-wide text-left"
                    style={{ color: cfg.text, opacity: 0.7 }}
                  >
                    {space.code}
                  </span>
                  <div className="w-3 h-3 rounded-full" style={{ background: cfg.dot, opacity: 0.85 }} />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Leyenda */}
      <div className="flex items-center gap-5 pt-1">
        {[
          { cfg: STATUS_CONFIG.available,   label: 'Disponible' },
          { cfg: STATUS_CONFIG.occupied,    label: 'Ocupado'    },
          { cfg: STATUS_CONFIG.selected,    label: 'Seleccionado' },
          { cfg: STATUS_CONFIG.disabled,    label: 'No compatible' },
        ].map(({ cfg, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              style={{
                width: 12, height: 12, borderRadius: 3,
                background: cfg.bg, border: `1.5px solid ${cfg.border}`,
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--space-legend-text)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
