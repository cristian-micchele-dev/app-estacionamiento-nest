import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, LogIn, AlertTriangle } from 'lucide-react'
import { VEHICLE_TYPE_LABEL, type VehicleType } from '@/data/parking.data'
import { vehiclesService, type VehicleApi } from '@/services/vehicles.service'
import { spacesService, type SpaceApi } from '@/services/spaces.service'
import SpaceMap from './SpaceMap'

interface Tariff {
  id: string
  name: string
  pricePerHour: number
}

interface EntryFormData {
  plate: string
  vehicleType: string
  tariffId: string
  spaceCode: string
  notes: string
}

interface EntryModalProps {
  open: boolean
  tariffs: Tariff[]
  onClose: () => void
  onConfirm: (data: EntryFormData) => Promise<void>
}

export default function EntryModal({ open, tariffs, onClose, onConfirm }: EntryModalProps) {
  const [plate, setPlate] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR')
  const [tariffId, setTariffId] = useState('')
  const [spaceCode, setSpaceCode] = useState('')
  const [spaces, setSpaces] = useState<SpaceApi[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const [suggestions, setSuggestions] = useState<VehicleApi[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const plateRef = useRef<HTMLInputElement>(null)

  const defaultTariffId = tariffId || tariffs[0]?.id || ''

  useEffect(() => {
    if (!open) return
    spacesService.findAll().then(setSpaces)
    const t = setTimeout(() => plateRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    setSpaceCode('')
  }, [vehicleType])

  useEffect(() => {
    if (plate.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(async () => {
      const res = await vehiclesService.findAll({ search: plate, limit: 6 })
      setSuggestions(res.data)
      setShowSuggestions(res.data.length > 0)
      setHighlightIdx(-1)
    }, 200)
    return () => clearTimeout(timer)
  }, [plate])

  function selectSuggestion(v: VehicleApi) {
    setPlate(v.plate)
    setVehicleType(v.type)
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightIdx(-1)
  }

  function handlePlateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[highlightIdx])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightIdx(-1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!plate.trim()) return
    setLoading(true)
    try {
      await onConfirm({ plate, vehicleType, tariffId: defaultTariffId, spaceCode, notes })
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setPlate('')
    setVehicleType('CAR')
    setTariffId('')
    setSpaceCode('')
    setNotes('')
    setSuggestions([])
    setShowSuggestions(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-xl flex flex-col max-h-[90vh]"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-blue)' }}>
              <LogIn size={16} style={{ color: '#3B82F6' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              Registrar Entrada
            </DialogTitle>
          </div>
        </DialogHeader>

        {tariffs.length === 0 && (
          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3 mt-2"
            style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}
          >
            <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#92400E' }}>
                No hay tarifas activas
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: '#B45309' }}>
                Creá al menos una tarifa en <strong>Tarifas</strong> antes de registrar una entrada.
              </p>
            </div>
          </div>
        )}

        <form id="entry-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2 overflow-y-auto pr-1">
          {/* Plate + autocomplete */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Patente *
            </label>
            <div className="relative">
              <Input
                ref={plateRef}
                placeholder="ABC 123"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())}
                onKeyDown={handlePlateKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="font-mono text-[15px] tracking-widest uppercase"
                maxLength={10}
                required
              />

              {showSuggestions && (
                <div
                  className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden bg-popover"
                  style={{ border: '1px solid var(--border-field)', boxShadow: '0 4px 16px rgba(0,0,0,0.20)' }}
                >
                  {suggestions.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onMouseDown={() => selectSuggestion(v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors"
                      style={{
                        background: i === highlightIdx ? 'var(--icon-bg-blue)' : 'transparent',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-field)' : undefined,
                      }}
                    >
                      <span
                        className="text-[14px] font-bold tracking-widest"
                        style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-heading)' }}
                      >
                        {v.plate}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--badge-neutral-bg)', color: 'var(--badge-neutral-text)' }}
                      >
                        {VEHICLE_TYPE_LABEL[v.type] ?? v.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Tipo de vehículo
            </label>
            <Select value={vehicleType} onValueChange={v => setVehicleType(v as VehicleType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(VEHICLE_TYPE_LABEL) as [VehicleType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tariff */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Tarifa
            </label>
            <Select value={defaultTariffId} onValueChange={setTariffId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tariffs.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — ${Number(t.pricePerHour).toLocaleString('es-AR')}/h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Space map */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
                Lugar *
              </label>
              {spaceCode && (
                <span
                  className="text-[12px] font-bold font-mono px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)' }}
                >
                  {spaceCode} seleccionado
                </span>
              )}
            </div>
            <SpaceMap
              spaces={spaces}
              vehicleType={vehicleType}
              selected={spaceCode}
              onSelect={setSpaceCode}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Observaciones <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <Input
              placeholder="Ej: vehículo con rayón lateral"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </form>

        <div className="flex gap-2 pt-2 border-t mt-auto" style={{ borderColor: 'var(--border-field)' }}>
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="entry-form"
            className="flex-1 gap-2"
            style={{ background: '#3B82F6' }}
            disabled={!plate.trim() || !spaceCode.trim() || loading || tariffs.length === 0}
          >
            <Car size={14} />
            {loading ? 'Registrando...' : 'Confirmar Entrada'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
