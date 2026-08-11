import { useEffect, useRef } from 'react'
import { BASE_URL } from '@/lib/config'

/**
 * Subscribes to the SSE parking events stream.
 * Calls `onSessionUpdated` whenever the server emits SESSION_UPDATED.
 * EventSource handles reconnection automatically on network drop.
 */
export function useParkingEvents(onSessionUpdated: () => void) {
  const callbackRef = useRef(onSessionUpdated)
  callbackRef.current = onSessionUpdated

  useEffect(() => {
    const es = new EventSource(`${BASE_URL}/parking/events`)

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const { type } = JSON.parse(e.data) as { type: string }
        if (type === 'SESSION_UPDATED') {
          callbackRef.current()
        }
      } catch {
        // malformed event — ignore
      }
    }

    return () => es.close()
  }, [])
}
