export type ShiftStatus = 'OPEN' | 'CLOSED'

export interface ShiftPaymentSummary {
  cash: number
  card: number
  transfer: number
  monthlyPass: number
}

export interface Shift {
  id: string
  cashier: string
  openedAt: Date
  closedAt: Date | null
  openingBalance: number
  closingBalanceCounted: number | null
  closingBalanceSystem: number | null
  difference: number | null
  status: ShiftStatus
  notes: string | null
  payments: ShiftPaymentSummary
}
