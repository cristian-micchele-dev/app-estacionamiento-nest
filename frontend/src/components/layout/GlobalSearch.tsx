import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Receipt, Search } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { vehiclesService, type VehicleApi } from '@/services/vehicles.service'
import { ticketsService, type TicketApi } from '@/services/tickets.service'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GlobalSearch({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('')
  const [vehicles, setVehicles] = useState<VehicleApi[]>([])
  const [tickets, setTickets] = useState<TicketApi[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setVehicles([])
      setTickets([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setVehicles([])
      setTickets([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [v, t] = await Promise.all([
          vehiclesService.findAll({ search: query, limit: 5 }),
          ticketsService.findAll({ search: query, limit: 5 }),
        ])
        setVehicles(v.data.slice(0, 5))
        setTickets(t.data.slice(0, 5))
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function goTo(path: string) {
    onOpenChange(false)
    navigate(path)
  }

  const hasResults = vehicles.length > 0 || tickets.length > 0
  const showEmpty = query.trim().length > 0 && !loading && !hasResults

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-lg p-0 gap-0 overflow-hidden translate-y-0"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar vehículos, tickets..."
            aria-label="Búsqueda global"
            aria-autocomplete="list"
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded shrink-0 bg-slate-100 text-slate-400 font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() && (
            <p className="text-xs text-center py-8 text-slate-300">
              Escribí para buscar vehículos o tickets
            </p>
          )}

          {showEmpty && (
            <p className="text-sm text-center py-8 text-slate-400">
              Sin resultados para{' '}
              <span className="font-semibold text-slate-500">
                "{query}"
              </span>
            </p>
          )}

          {vehicles.length > 0 && (
            <section>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Vehículos
              </p>
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => goTo('/vehicles')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-blue-50">
                    <Car size={15} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-800">{v.plate}</p>
                    <p className="text-xs truncate text-slate-400">
                      {[v.brand, v.color, v.type].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {tickets.length > 0 && (
            <section>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Tickets
              </p>
              {tickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onOpenChange(false); navigate('/tickets', { state: { selectedTicket: t } }) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-green-50">
                    <Receipt size={15} className="text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-800">
                      {t.session?.ticketNumber ?? `#${t.id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs truncate text-slate-400">
                      ${Number(t.totalAmount).toFixed(2)} · {t.status}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {hasResults && (
            <div className="px-4 py-2.5 border-t border-slate-50">
              <p className="text-[11px] text-slate-300">
                Mostrando hasta 5 resultados por categoría
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
