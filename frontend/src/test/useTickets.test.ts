import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ToastProvider } from '@/contexts/ToastContext'
import { useTickets } from '@/hooks/useTickets'
import { ticketsService } from '@/services/tickets.service'

vi.mock('@/services/tickets.service', () => ({
  ticketsService: {
    findAll: vi.fn(),
  },
}))

const mockFindAll = vi.mocked(ticketsService.findAll)

const MOCK_RESPONSE = {
  data: [
    {
      id: 'abc-123',
      status: 'PAID',
      totalAmount: '1500',
      discountAmount: '0',
      session: { ticketNumber: 'T-001' },
    },
  ],
  total: 1,
  totalPages: 1,
}

beforeEach(() => {
  vi.useFakeTimers()
  mockFindAll.mockResolvedValue(MOCK_RESPONSE as any)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

async function flush() {
  await act(async () => {
    await vi.runAllTimersAsync()
  })
}

describe('useTickets', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useTickets({ page: 1, limit: 20 }), {
      wrapper: ToastProvider,
    })
    expect(result.current.loading).toBe(true)
  })

  it('fetches tickets and returns them', async () => {
    const { result } = renderHook(() => useTickets({ page: 1, limit: 20 }), {
      wrapper: ToastProvider,
    })

    await flush()

    expect(result.current.loading).toBe(false)
    expect(result.current.tickets).toHaveLength(1)
    expect(result.current.tickets[0].status).toBe('PAID')
    expect(result.current.total).toBe(1)
  })

  it('refetches when status filter changes', async () => {
    const { rerender } = renderHook(
      ({ status }: { status?: string }) => useTickets({ status, page: 1, limit: 20 }),
      { wrapper: ToastProvider, initialProps: { status: undefined } }
    )

    await flush()
    expect(mockFindAll).toHaveBeenCalledTimes(1)

    act(() => { rerender({ status: 'PAID' }) })
    await flush()

    expect(mockFindAll).toHaveBeenCalledTimes(2)
    expect(mockFindAll).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PAID' }))
  })

  it('allows optimistic local updates via setTickets', async () => {
    const { result } = renderHook(() => useTickets({ page: 1, limit: 20 }), {
      wrapper: ToastProvider,
    })

    await flush()
    expect(result.current.tickets).toHaveLength(1)

    act(() => {
      result.current.setTickets(prev => prev.filter(t => t.id !== 'abc-123'))
    })

    expect(result.current.tickets).toHaveLength(0)
  })
})
