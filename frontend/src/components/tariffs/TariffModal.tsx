import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tag } from 'lucide-react'
import type { TariffApi } from '@/services/tariffs.service'

interface TariffModalProps {
  open: boolean
  tariff: TariffApi | null
  onClose: () => void
  onConfirm: (data: Omit<TariffApi, 'id'>) => void
}

const EMPTY: Omit<TariffApi, 'id'> = {
  name: '', isActive: true,
  pricePerHour: 0, pricePerHalfHour: 0,
  toleranceMinutes: 10, dailyMax: null,
  overnightRate: null, overnightStartHour: 22, overnightEndHour: 8,
  effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: null,
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

export default function TariffModal({ open, tariff, onClose, onConfirm }: TariffModalProps) {
  const [form, setForm] = useState<Omit<TariffApi, 'id'>>(EMPTY)

  useEffect(() => {
    setForm(tariff ? { ...tariff } : EMPTY)
  }, [tariff, open])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function num(value: string): number {
    return parseFloat(value) || 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(form)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-yellow)' }}>
              <Tag size={16} style={{ color: '#F59E0B' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              {tariff ? 'Editar Tarifa' : 'Nueva Tarifa'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          {/* Basic */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>General</p>
            <Field label="Nombre *">
              <Input
                placeholder="Ej: General, Motocicleta..."
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required autoFocus={!tariff}
              />
            </Field>

            {/* Active toggle */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'var(--surface-field)', border: '1px solid var(--border-field)' }}>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>Tarifa activa</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Solo las tarifas activas aparecen al registrar una entrada</p>
              </div>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className="relative w-10 h-6 rounded-full transition-colors"
                style={{ background: form.isActive ? '#3B82F6' : 'var(--toggle-off)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm"
                  style={{ transform: form.isActive ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          </section>

          {/* Rates */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Tarifas</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio por hora *">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>$</span>
                  <Input
                    type="number" min={0} className="pl-6"
                    value={form.pricePerHour || ''}
                    onChange={e => set('pricePerHour', num(e.target.value))}
                    required style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              </Field>
              <Field label="Precio media hora *">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>$</span>
                  <Input
                    type="number" min={0} className="pl-6"
                    value={form.pricePerHalfHour || ''}
                    onChange={e => set('pricePerHalfHour', num(e.target.value))}
                    required style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tolerancia" hint="minutos">
                <Input
                  type="number" min={0} max={60}
                  value={form.toleranceMinutes}
                  onChange={e => set('toleranceMinutes', num(e.target.value))}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
              </Field>
              <Field label="Máximo diario" hint="opcional">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>$</span>
                  <Input
                    type="number" min={0} className="pl-6"
                    value={form.dailyMax ?? ''}
                    onChange={e => set('dailyMax', e.target.value ? num(e.target.value) : null)}
                    placeholder="Sin límite"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* Overnight */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Tarifa nocturna</p>
              <button
                type="button"
                onClick={() => set('overnightRate', form.overnightRate === null ? 0 : null)}
                className="relative w-8 h-4 rounded-full transition-colors"
                style={{ background: form.overnightRate !== null ? '#3B82F6' : 'var(--toggle-off)' }}
                title={form.overnightRate !== null ? 'Deshabilitar' : 'Habilitar'}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm"
                  style={{ transform: form.overnightRate !== null ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {form.overnightRate !== null ? (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Precio/hora">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>$</span>
                    <Input
                      type="number" min={0} className="pl-6"
                      value={form.overnightRate ?? ''}
                      onChange={e => set('overnightRate', e.target.value ? num(e.target.value) : 0)}
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    />
                  </div>
                </Field>
                <Field label="Desde (hora)">
                  <Input
                    type="number" min={0} max={23}
                    value={form.overnightStartHour}
                    onChange={e => set('overnightStartHour', num(e.target.value))}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </Field>
                <Field label="Hasta (hora)">
                  <Input
                    type="number" min={0} max={23}
                    value={form.overnightEndHour}
                    onChange={e => set('overnightEndHour', num(e.target.value))}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </Field>
              </div>
            ) : (
              <p className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }}>
                Habilitá esta sección para aplicar una tarifa diferente en horario nocturno.
              </p>
            )}
          </section>

          {/* Validity */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Vigencia</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde *">
                <Input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={e => set('effectiveFrom', e.target.value)}
                  required
                />
              </Field>
              <Field label="Hasta" hint="opcional">
                <Input
                  type="date"
                  value={form.effectiveTo ?? ''}
                  onChange={e => set('effectiveTo', e.target.value || null)}
                />
              </Field>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" style={{ background: '#F59E0B' }} disabled={!form.name.trim()}>
              {tariff ? 'Guardar cambios' : 'Crear Tarifa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
