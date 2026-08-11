import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ShiftStatusCard from '@/components/dashboard/ShiftStatusCard'
import { type ShiftApi } from '@/services/shifts.service'

const mockShift: ShiftApi = {
  id: 'shift-1',
  status: 'OPEN',
  openedAt: new Date(Date.now() - 3_600_000).toISOString(), // 1 hour ago
  closedAt: null,
  openingBalance: 5000,
  closingBalanceCounted: null,
  closingBalanceSystem: null,
  difference: null,
  notes: null,
  cashier: { id: 'user-1', name: 'María García' },
}

describe('ShiftStatusCard', () => {
  it('shows loading text when loading', () => {
    render(<ShiftStatusCard shift={null} loading={true} />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows empty state when no shift is open', () => {
    render(<ShiftStatusCard shift={null} loading={false} />)
    expect(screen.getByText('Sin turno abierto')).toBeInTheDocument()
  })

  it('shows ABIERTO badge when a shift is open', () => {
    render(<ShiftStatusCard shift={mockShift} loading={false} />)
    expect(screen.getByText(/ABIERTO/)).toBeInTheDocument()
  })

  it('shows the cashier name', () => {
    render(<ShiftStatusCard shift={mockShift} loading={false} />)
    expect(screen.getByText('María García')).toBeInTheDocument()
  })

  it('shows the opening balance label', () => {
    render(<ShiftStatusCard shift={mockShift} loading={false} />)
    expect(screen.getByText(/Saldo inicial/)).toBeInTheDocument()
  })

  it('shows — when cashier name is missing', () => {
    const shiftWithoutCashier = { ...mockShift, cashier: undefined } as any
    render(<ShiftStatusCard shift={shiftWithoutCashier} loading={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('does not show the empty state when a shift is loaded', () => {
    render(<ShiftStatusCard shift={mockShift} loading={false} />)
    expect(screen.queryByText('Sin turno abierto')).not.toBeInTheDocument()
  })
})
