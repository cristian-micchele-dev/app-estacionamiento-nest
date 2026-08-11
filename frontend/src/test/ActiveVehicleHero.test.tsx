import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ActiveVehicleHero from '@/components/dashboard/ActiveVehicleHero'
import { type ParkingSessionApi } from '@/services/parking.service'

function makeSession(plate: string, id = plate): ParkingSessionApi {
  return { id, vehicle: { plate } } as any
}

describe('ActiveVehicleHero', () => {
  it('hides the LIVE indicator and count label while loading', () => {
    render(<ActiveVehicleHero sessions={[makeSession('ABC123')]} loading={true} />)
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    expect(screen.queryByText(/vehículo/)).not.toBeInTheDocument()
  })

  it('shows 00 and empty-state text when no vehicles are parked', () => {
    render(<ActiveVehicleHero sessions={[]} loading={false} />)
    expect(screen.getByText('00')).toBeInTheDocument()
    expect(screen.getByText('Sin vehículos')).toBeInTheDocument()
  })

  it('uses the singular label for exactly one vehicle', () => {
    render(<ActiveVehicleHero sessions={[makeSession('ABC123')]} loading={false} />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('vehículo')).toBeInTheDocument()
  })

  it('uses the plural label for more than one vehicle', () => {
    const sessions = [makeSession('ABC123'), makeSession('XYZ999')]
    render(<ActiveVehicleHero sessions={sessions} loading={false} />)
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('vehículos')).toBeInTheDocument()
  })

  it('renders each plate', () => {
    const sessions = [makeSession('ABC123'), makeSession('XYZ999')]
    render(<ActiveVehicleHero sessions={sessions} loading={false} />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('XYZ999')).toBeInTheDocument()
  })

  it('shows LIVE indicator when vehicles are present', () => {
    render(<ActiveVehicleHero sessions={[makeSession('ABC123')]} loading={false} />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('hides LIVE indicator when no vehicles are present', () => {
    render(<ActiveVehicleHero sessions={[]} loading={false} />)
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
  })

  it('shows only the first 5 plates and a +N más indicator for the rest', () => {
    const sessions = Array.from({ length: 8 }, (_, i) => makeSession(`PLT00${i}`, `id-${i}`))
    render(<ActiveVehicleHero sessions={sessions} loading={false} />)

    // First 5 plates visible
    expect(screen.getByText('PLT000')).toBeInTheDocument()
    expect(screen.getByText('PLT004')).toBeInTheDocument()

    // 6th and beyond are hidden
    expect(screen.queryByText('PLT005')).not.toBeInTheDocument()

    // Overflow indicator for remaining 3
    expect(screen.getByText('+3 más')).toBeInTheDocument()
  })

  it('does not show +N más when there are exactly 5 sessions', () => {
    const sessions = Array.from({ length: 5 }, (_, i) => makeSession(`PLT00${i}`, `id-${i}`))
    render(<ActiveVehicleHero sessions={sessions} loading={false} />)
    expect(screen.queryByText(/más/)).not.toBeInTheDocument()
  })
})
