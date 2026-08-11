import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IdCard } from 'lucide-react'
import type { MonthlyPassApi } from '@/services/monthly-passes.service'

export interface MonthlyPassFormData {
  plate: string
  vehicleType: string
  holderName: string
  holderPhone: string | null
  holderEmail: string | null
  validFrom: string
  validTo: string
  pricePaid: number
  isActive: boolean
  notes: string | null
}

interface MonthlyPassModalProps {
  open: boolean
  pass: MonthlyPassApi | null
  onClose: () => void
  onConfirm: (data: MonthlyPassFormData) => void | Promise<void>
}

const VEHICLE_TYPES = ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS']
const VEHICLE_TYPE_LABEL: Record<string, string> = {
  CAR: 'Auto', MOTORCYCLE: 'Moto', TRUCK: 'Camión', VAN: 'Camioneta', BUS: 'Bus',
}

const EMPTY: MonthlyPassFormData = {
  plate: '',
  vehicleType: 'CAR',
  holderName: '',
  holderPhone: null,
  holderEmail: null,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10) })(),
  pricePaid: 0,
  isActive: true,
  notes: null,
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: 'var(--text-hint)' }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}

export default function MonthlyPassModal({ open, pass, onClose, onConfirm }: MonthlyPassModalProps) {
  const [form, setForm] = useState<MonthlyPassFormData>(EMPTY)

  useEffect(() => {
    if (pass) {
      setForm({
        plate: pass.vehicle.plate,
        vehicleType: pass.vehicle.type,
        holderName: pass.holderName,
        holderPhone: pass.holderPhone,
        holderEmail: pass.holderEmail,
        validFrom: pass.validFrom,
        validTo: pass.validTo,
        pricePaid: Number(pass.pricePaid),
        isActive: pass.isActive,
        notes: pass.notes,
      })
    } else {
      setForm(EMPTY)
    }
  }, [pass, open])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm({ ...form, plate: form.plate.toUpperCase() })
    onClose()
  }

  const isEdit = !!pass

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-cyan)' }}>
              <IdCard size={16} style={{ color: '#0891B2' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              {isEdit ? 'Editar Abono' : 'Nuevo Abono'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          {/* Vehicle */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Vehículo</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Patente *">
                <Input
                  placeholder="AB123CD"
                  value={form.plate}
                  onChange={e => set('plate', e.target.value.toUpperCase())}
                  disabled={isEdit}
                  required
                  style={{ fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={form.vehicleType}
                  onChange={e => set('vehicleType', e.target.value)}
                  className="h-9 rounded-md border px-3 text-[13px] bg-transparent"
                  style={{ borderColor: 'var(--border-field)', color: 'var(--text-heading)' }}
                >
                  {VEHICLE_TYPES.map(t => (
                    <option key={t} value={t}>{VEHICLE_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Holder */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Titular</p>
            <Field label="Nombre *">
              <Input
                placeholder="Nombre completo o razón social"
                value={form.holderName}
                onChange={e => set('holderName', e.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono" hint="opcional">
                <Input
                  placeholder="11-5555-1234"
                  value={form.holderPhone ?? ''}
                  onChange={e => set('holderPhone', e.target.value || null)}
                />
              </Field>
              <Field label="Email" hint="opcional">
                <Input
                  type="email"
                  placeholder="mail@ejemplo.com"
                  value={form.holderEmail ?? ''}
                  onChange={e => set('holderEmail', e.target.value || null)}
                />
              </Field>
            </div>
          </section>

          {/* Validity & Price */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Vigencia y precio</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde *">
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={e => set('validFrom', e.target.value)}
                  required
                />
              </Field>
              <Field label="Hasta *">
                <Input
                  type="date"
                  value={form.validTo}
                  onChange={e => set('validTo', e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="Precio pagado *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>$</span>
                <Input
                  type="number"
                  min={0}
                  className="pl-6"
                  value={form.pricePaid || ''}
                  onChange={e => set('pricePaid', parseFloat(e.target.value) || 0)}
                  required
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>
            </Field>
          </section>

          {/* Notes */}
          <Field label="Notas" hint="opcional">
            <textarea
              className="w-full rounded-lg px-3 py-2 text-[13px] resize-none bg-transparent"
              style={{ border: '1px solid var(--border-field)', outline: 'none', color: 'var(--text-heading)', minHeight: 56 }}
              placeholder="Observaciones..."
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={2}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              className="flex-1"
              style={{ background: '#0891B2' }}
              disabled={!form.plate.trim() || !form.holderName.trim()}
            >
              {isEdit ? 'Guardar cambios' : 'Crear Abono'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
