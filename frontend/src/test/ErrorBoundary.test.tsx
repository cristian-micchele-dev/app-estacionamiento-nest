import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ErrorBoundary from '@/components/ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test error')
  return <p>ok</p>
}

// Suppress console.error for expected errors
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument()
  })

  it('shows the error message in the details section', async () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    await userEvent.click(screen.getByText(/ver detalle/i))
    expect(screen.getByText('test error')).toBeInTheDocument()
  })
})
