import { useEffect, useRef, useState } from 'react'
import { BASE_URL } from '@/lib/config'

/**
 * Subscribes to the SSE parking events stream.
 * Calls `onSessionUpdated` whenever the server emits SESSION_UPDATED.
 * Returns `connected` so consumers can show a reconnecting banner.
 */
export function useParkingEvents(onSessionUpdated: () => void): { connected: boolean } {
  const callbackRef = useRef(onSessionUpdated)
  callbackRef.current = onSessionUpdated
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    const es = new EventSource(`${BASE_URL}/parking/events`)

    es.onopen = () => setConnected(true)

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

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [])

  return { connected }
}
