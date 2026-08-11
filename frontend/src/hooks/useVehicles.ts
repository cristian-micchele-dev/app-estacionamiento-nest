import { useState, useEffect } from 'react'
import { vehiclesService, type VehicleApi, type VehicleQuery } from '@/services/vehicles.service'
import { useToast } from '@/contexts/ToastContext'

interface VehiclesState {
  vehicles: VehicleApi[]
  loading: boolean
  total: number
  totalPages: number
}

const INITIAL_STATE: VehiclesState = {
  vehicles: [],
  loading: true,
  total: 0,
  totalPages: 1,
}

const SEARCH_DEBOUNCE_MS = 300

interface UseVehiclesQuery extends VehicleQuery {
  refreshKey?: number
}

export function useVehicles(query: UseVehiclesQuery) {
  const [state, setState] = useState<VehiclesState>(INITIAL_STATE)
  const { toast } = useToast()
  const { search, type, page, limit, refreshKey } = query

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true }))

    const timer = setTimeout(async () => {
      try {
        const res = await vehiclesService.findAll({ search, type, page, limit })
        if (!cancelled) {
          setState({
            vehicles: res.data,
            loading: false,
            total: res.total,
            totalPages: res.totalPages,
          })
        }
      } catch {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false }))
          toast.error('No se pudieron cargar los vehículos')
        }
      }
    }, search ? SEARCH_DEBOUNCE_MS : 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, type, page, limit, refreshKey])

  return state
}
