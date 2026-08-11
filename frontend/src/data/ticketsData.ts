import type { TicketStatus } from '@/services/tickets.service'

export const STATUS_LABEL: Record<TicketStatus, string> = {
  PENDING:   'Pendiente',
  PAID:      'Pagado',
  CANCELLED: 'Cancelado',
}

export const STATUS_STYLE: Record<TicketStatus, { bg: string; text: string }> = {
  PENDING:   { bg: 'bg-signal/10', text: 'text-signal-dark' },
  PAID:      { bg: 'bg-green-50', text: 'text-green-600' },
  CANCELLED: { bg: 'bg-red-50',   text: 'text-red-600'   },
}
