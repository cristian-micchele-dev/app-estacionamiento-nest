export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'VAN'
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MONTHLY_PASS'

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  CAR:        'Automóvil',
  MOTORCYCLE: 'Motocicleta',
  TRUCK:      'Camión',
  VAN:        'Camioneta',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH:         'Efectivo',
  CARD:         'Tarjeta',
  TRANSFER:     'Transferencia',
  MONTHLY_PASS: 'Abono',
}

export function formatElapsed(entryTime: Date): string {
  const diffMs = new Date().getTime() - entryTime.getTime()
  const totalMinutes = Math.floor(diffMs / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
