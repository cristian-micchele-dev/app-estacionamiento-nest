import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ToastProvider } from '@/contexts/ToastContext'
import { useVehicles } from '@/hooks/useVehicles'
import { vehiclesService } from '@/services/vehicles.service'

vi.mock('@/services/vehicles.service', () => ({
  vehiclesService: {
    findAll: vi.fn(),
  },
}))

const mockFindAll = vi.mocked(vehiclesService.findAll)

const MOCK_RESPONSE = {
  data: [{ id: '1', plate: 'ABC123', brand: 'Toyota', color: 'Rojo', type: 'CAR', createdAt: '' }],
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

describe('useVehicles', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useVehicles({ page: 1, limit: 20 }), {
      wrapper: ToastProvider,
    })
    expect(result.current.loading).toBe(true)
  })

  it('fetches vehicles and returns them', async () => {
    const { result } = renderHook(() => useVehicles({ page: 1, limit: 20 }), {
      wrapper: ToastProvider,
    })

    await flush()

    expect(result.current.loading).toBe(false)
    expect(result.current.vehicles).toHaveLength(1)
    expect(result.current.vehicles[0].plate).toBe('ABC123')
    expect(result.current.total).toBe(1)
  })

  it('debounces search queries', async () => {
    const { rerender } = renderHook(
      ({ search }: { search?: string }) => useVehicles({ search, page: 1, limit: 20 }),
      { wrapper: ToastProvider, initialProps: { search: 'A' } }
    )

    act(() => { rerender({ search: 'AB' }) })
    act(() => { rerender({ search: 'ABC' }) })

    await flush()

    // Debounce collapsed multiple rerenders into one call
    expect(mockFindAll).toHaveBeenCalledTimes(1)
    expect(mockFindAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'ABC' }))
  })

  it('keeps empty vehicles and stops loading when service fails', async () => {
    mockFindAll.mockRejectedValueOnce(new Error('network error'))

    const { result } = renderHook(() => useVehicles({ page: 1, limit: 20 }), {
      wrapper: ToastProvider,
    })

    await flush()

    expect(result.current.loading).toBe(false)
    expect(result.current.vehicles).toHaveLength(0)
  })
})
