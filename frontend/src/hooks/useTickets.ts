import { useState, useEffect } from 'react'
import { ticketsService, type TicketApi, type TicketQuery } from '@/services/tickets.service'
import { useToast } from '@/contexts/ToastContext'

interface TicketsState {
  tickets: TicketApi[]
  loading: boolean
  total: number
  totalPages: number
}

const INITIAL_STATE: TicketsState = {
  tickets: [],
  loading: true,
  total: 0,
  totalPages: 1,
}

const SEARCH_DEBOUNCE_MS = 300

export function useTickets(query: TicketQuery) {
  const [state, setState] = useState<TicketsState>(INITIAL_STATE)
  const { toast } = useToast()
  const { search, status, dateFrom, dateTo, page, limit } = query

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true }))

    const timer = setTimeout(async () => {
      try {
        const res = await ticketsService.findAll({ search, status, dateFrom, dateTo, page, limit })
        if (!cancelled) {
          setState({
            tickets: res.data,
            loading: false,
            total: res.total,
            totalPages: res.totalPages,
          })
        }
      } catch {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false }))
          toast.error('No se pudieron cargar los tickets')
        }
      }
    }, search ? SEARCH_DEBOUNCE_MS : 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, status, dateFrom, dateTo, page, limit])

  function setTickets(updater: (prev: TicketApi[]) => TicketApi[]) {
    setState(s => ({ ...s, tickets: updater(s.tickets) }))
  }

  return { ...state, setTickets }
}
