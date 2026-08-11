export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'BUS'

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  CAR:        'Automóvil',
  MOTORCYCLE: 'Motocicleta',
  TRUCK:      'Camión',
  VAN:        'Camioneta',
  BUS:        'Colectivo',
}

export const VEHICLE_TYPE_STYLE: Record<VehicleType, { bg: string; text: string }> = {
  CAR:        { bg: 'bg-blue-50',    text: 'text-blue-500'   },
  MOTORCYCLE: { bg: 'bg-fuchsia-50', text: 'text-purple-500' },
  TRUCK:      { bg: 'bg-orange-50',  text: 'text-orange-500' },
  VAN:        { bg: 'bg-green-50',   text: 'text-green-500'  },
  BUS:        { bg: 'bg-rose-50',    text: 'text-rose-600'   },
}

export const COLOR_SWATCHES: Record<string, string> = {
  'Blanco':    '#F8FAFC',
  'Negro':     '#1E293B',
  'Plata':     '#94A3B8',
  'Gris':      '#64748B',
  'Rojo':      '#EF4444',
  'Azul':      '#3B82F6',
  'Verde':     '#22C55E',
  'Amarillo':  '#EAB308',
  'Naranja':   '#F97316',
  'Marrón':    '#92400E',
  'Bordo':     '#9F1239',
  'Beige':     '#D4B896',
}
