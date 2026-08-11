import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car } from 'lucide-react'
import {
  VEHICLE_TYPE_LABEL,
  COLOR_SWATCHES,
  type Vehicle,
  type VehicleType,
} from '@/data/vehicles.data'

interface VehicleModalProps {
  open: boolean
  vehicle: Vehicle | null
  onClose: () => void
  onConfirm: (data: Omit<Vehicle, 'id' | 'lastVisit' | 'totalVisits'>) => void
}

const EMPTY = { plate: '', type: 'CAR' as VehicleType, brand: '', color: '', observations: '' }

export default function VehicleModal({ open, vehicle, onClose, onConfirm }: VehicleModalProps) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (vehicle) {
      setForm({
        plate:        vehicle.plate,
        type:         vehicle.type,
        brand:        vehicle.brand ?? '',
        color:        vehicle.color ?? '',
        observations: vehicle.observations ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [vehicle, open])

  function set(key: keyof typeof EMPTY, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm({
      plate:        form.plate.toUpperCase().trim(),
      type:         form.type,
      brand:        form.brand.trim() || null,
      color:        form.color.trim() || null,
      observations: form.observations.trim() || null,
    })
    onClose()
  }

  const isEdit = Boolean(vehicle)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-blue)' }}>
              <Car size={16} style={{ color: '#3B82F6' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              {isEdit ? 'Editar Vehículo' : 'Agregar Vehículo'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Plate */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Patente *
            </label>
            <Input
              placeholder="ABC 123"
              value={form.plate}
              onChange={e => set('plate', e.target.value.toUpperCase())}
              className="font-mono text-[15px] tracking-widest uppercase"
              maxLength={10}
              required
              autoFocus={!isEdit}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>La patente no se puede modificar.</p>
            )}
          </div>

          {/* Type + Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>Tipo</label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(VEHICLE_TYPE_LABEL) as [VehicleType, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
                Marca <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <Input
                placeholder="Toyota, Ford..."
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
              />
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Color <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(COLOR_SWATCHES).map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => set('color', name)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                  style={{
                    borderColor: form.color === name ? '#3B82F6' : 'var(--border-field)',
                    background: form.color === name ? 'var(--icon-bg-blue)' : 'var(--surface-field)',
                    color: form.color === name ? '#3B82F6' : 'var(--text-secondary)',
                    outline: form.color === name ? '2px solid rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full border"
                    style={{ background: hex, borderColor: name === 'Blanco' ? 'var(--border-field)' : hex }}
                  />
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Observaciones <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <Textarea
              placeholder="Ej: vehículo con rayón lateral derecho"
              value={form.observations}
              onChange={e => set('observations', e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              style={{ background: '#3B82F6' }}
              disabled={!form.plate.trim()}
            >
              {isEdit ? 'Guardar cambios' : 'Agregar Vehículo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
