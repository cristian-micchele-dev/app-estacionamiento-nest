import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useParkingEvents } from '@/hooks/useParkingEvents'

vi.mock('@/lib/config', () => ({ BASE_URL: 'http://localhost:3000/api/v1' }))

// ─── Mock EventSource ─────────────────────────────────────────────────────────

class MockEventSource {
  static instance: MockEventSource | null = null
  url: string
  onmessage: ((e: Partial<MessageEvent>) => void) | null = null
  close = vi.fn()

  constructor(url: string) {
    this.url = url
    MockEventSource.instance = this
  }
}

beforeEach(() => {
  MockEventSource.instance = null
  vi.stubGlobal('EventSource', MockEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function fireMessage(data: unknown) {
  act(() => {
    MockEventSource.instance!.onmessage!({ data: JSON.stringify(data) } as any)
  })
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('useParkingEvents', () => {
  it('creates an EventSource for the parking events endpoint', () => {
    renderHook(() => useParkingEvents(vi.fn()))

    expect(MockEventSource.instance?.url).toBe('http://localhost:3000/api/v1/parking/events')
  })

  it('calls onSessionUpdated when a SESSION_UPDATED event arrives', () => {
    const callback = vi.fn()
    renderHook(() => useParkingEvents(callback))

    fireMessage({ type: 'SESSION_UPDATED' })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('ignores events of other types', () => {
    const callback = vi.fn()
    renderHook(() => useParkingEvents(callback))

    fireMessage({ type: 'HEARTBEAT' })

    expect(callback).not.toHaveBeenCalled()
  })

  it('ignores malformed (non-JSON) messages', () => {
    const callback = vi.fn()
    renderHook(() => useParkingEvents(callback))

    act(() => {
      MockEventSource.instance!.onmessage!({ data: 'not-valid-json' } as any)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('always calls the latest callback, even if it changed after mount', () => {
    const firstCallback  = vi.fn()
    const secondCallback = vi.fn()

    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useParkingEvents(cb),
      { initialProps: { cb: firstCallback } },
    )

    rerender({ cb: secondCallback })
    fireMessage({ type: 'SESSION_UPDATED' })

    expect(secondCallback).toHaveBeenCalledTimes(1)
    expect(firstCallback).not.toHaveBeenCalled()
  })

  it('closes the EventSource when the component unmounts', () => {
    const { unmount } = renderHook(() => useParkingEvents(vi.fn()))
    const es = MockEventSource.instance!

    unmount()

    expect(es.close).toHaveBeenCalledTimes(1)
  })
})
