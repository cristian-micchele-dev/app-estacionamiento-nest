import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed'
import { type ParkingSessionApi } from '@/services/parking.service'

// ─── Factories ────────────────────────────────────────────────────────────────

function makeActive(plate: string, id = plate): ParkingSessionApi {
  return {
    id,
    status: 'ACTIVE',
    entryTime: new Date(Date.now() - 1_800_000).toISOString(),
    exitTime: null,
    ticketNumber: `T-${id}`,
    vehicle: { plate },
    tariff: { name: 'General' },
    entryBy: { name: 'Juan' },
  } as any
}

function makeCompleted(plate: string, id = plate): ParkingSessionApi {
  return {
    id,
    status: 'COMPLETED',
    entryTime: new Date(Date.now() - 7_200_000).toISOString(),
    exitTime: new Date(Date.now() - 3_600_000).toISOString(),
    ticketNumber: `T-${id}`,
    vehicle: { plate },
    tariff: { name: 'General' },
    entryBy: { name: 'María' },
  } as any
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('RecentActivityFeed', () => {
  it('shows loading text while loading', () => {
    render(<RecentActivityFeed sessions={[]} loading={true} onViewAll={vi.fn()} />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows empty-state text when there are no sessions', () => {
    render(<RecentActivityFeed sessions={[]} loading={false} onViewAll={vi.fn()} />)
    expect(screen.getByText('Sin actividad registrada')).toBeInTheDocument()
  })

  it('displays the active section and plate for active sessions', () => {
    render(
      <RecentActivityFeed sessions={[makeActive('ABC123')]} loading={false} onViewAll={vi.fn()} />,
    )
    expect(screen.getByText(/En playa/i)).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('shows the count of active sessions in the section header', () => {
    const sessions = [makeActive('ABC123', 'a'), makeActive('XYZ999', 'b')]
    render(<RecentActivityFeed sessions={sessions} loading={false} onViewAll={vi.fn()} />)
    expect(screen.getByText(/En playa · 2/i)).toBeInTheDocument()
  })

  it('displays the completed section and plate for completed sessions', () => {
    render(
      <RecentActivityFeed sessions={[makeCompleted('XYZ999')]} loading={false} onViewAll={vi.fn()} />,
    )
    expect(screen.getByText('Completadas')).toBeInTheDocument()
    expect(screen.getByText('XYZ999')).toBeInTheDocument()
  })

  it('renders both sections when there are active and completed sessions', () => {
    const sessions = [makeActive('ACT001', 'a'), makeCompleted('CPL001', 'c')]
    render(<RecentActivityFeed sessions={sessions} loading={false} onViewAll={vi.fn()} />)
    expect(screen.getByText(/En playa/i)).toBeInTheDocument()
    expect(screen.getByText('Completadas')).toBeInTheDocument()
    expect(screen.getByText('ACT001')).toBeInTheDocument()
    expect(screen.getByText('CPL001')).toBeInTheDocument()
  })

  it('calls onViewAll when the "Ver todo" button is clicked', async () => {
    const onViewAll = vi.fn()
    render(<RecentActivityFeed sessions={[]} loading={false} onViewAll={onViewAll} />)

    await userEvent.click(screen.getByText(/Ver todo/i))

    expect(onViewAll).toHaveBeenCalledTimes(1)
  })

  it('does not show the empty state when sessions exist', () => {
    render(
      <RecentActivityFeed sessions={[makeActive('ABC123')]} loading={false} onViewAll={vi.fn()} />,
    )
    expect(screen.queryByText('Sin actividad registrada')).not.toBeInTheDocument()
  })
})
