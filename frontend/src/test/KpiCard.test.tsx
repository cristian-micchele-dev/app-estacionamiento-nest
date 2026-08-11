import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Car } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'

const defaults = {
  icon: Car,
  label: 'Vehículos activos',
  value: 42 as number | string,
  sublabel: 'en el período',
  variant: 'green' as const,
  loading: false,
}

describe('KpiCard', () => {
  it('renders label and sublabel', () => {
    render(<KpiCard {...defaults} />)
    expect(screen.getByText('Vehículos activos')).toBeInTheDocument()
    expect(screen.getByText('en el período')).toBeInTheDocument()
  })

  it('renders the numeric value when not loading', () => {
    render(<KpiCard {...defaults} value={99} />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('renders string values correctly', () => {
    render(<KpiCard {...defaults} value="$1.500" />)
    expect(screen.getByText('$1.500')).toBeInTheDocument()
  })

  it('shows — when loading', () => {
    render(<KpiCard {...defaults} loading={true} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('does not show the value when loading', () => {
    render(<KpiCard {...defaults} value={42} loading={true} />)
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })
})
