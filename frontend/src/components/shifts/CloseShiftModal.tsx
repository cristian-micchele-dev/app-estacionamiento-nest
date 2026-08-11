import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Banknote, CreditCard, ArrowLeftRight, IdCard } from 'lucide-react'
import type { Shift } from '@/data/shifts.data'

interface CloseShiftModalProps {
  open: boolean
  shift: Shift | null
  onClose: () => void
  onConfirm: (closingBalance: number, notes: string) => void
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-AR')}`
}

export default function CloseShiftModal({ open, shift, onClose, onConfirm }: CloseShiftModalProps) {
  const [counted, setCounted] = useState('')
  const [notes, setNotes] = useState('')

  if (!shift) return null

  const systemTotal =
    shift.openingBalance +
    shift.payments.cash +
    shift.payments.card +
    shift.payments.transfer +
    shift.payments.monthlyPass

  const countedNum = parseFloat(counted) || 0
  const diff = countedNum - systemTotal

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(countedNum, notes)
    setCounted('')
    setNotes('')
  }

  const paymentRows = [
    { label: 'Efectivo',      icon: Banknote,       value: shift.payments.cash,        color: '#22C55E' },
    { label: 'Tarjeta',       icon: CreditCard,      value: shift.payments.card,        color: '#3B82F6' },
    { label: 'Transferencia', icon: ArrowLeftRight,  value: shift.payments.transfer,    color: '#8B5CF6' },
    { label: 'Abonos',        icon: IdCard,          value: shift.payments.monthlyPass, color: '#F59E0B' },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-red)' }}>
              <Lock size={16} style={{ color: '#EF4444' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              Cerrar Turno
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Operator info */}
          <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-field)', border: '1px solid var(--border-field)' }}>
            <p className="text-[12px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Operador</p>
            <p className="text-[15px] font-bold" style={{ color: 'var(--text-heading)' }}>{shift.cashier}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Apertura: {shift.openedAt.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </p>
          </div>

          {/* Payment breakdown */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Resumen de cobros</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-field)' }}>
              {paymentRows.map(({ label, icon: Icon, value, color }, i) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{ borderTop: i > 0 ? '1px solid var(--border-field)' : undefined }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color }} />
                    <span className="text-[13px]" style={{ color: 'var(--text-label)' }}>{label}</span>
                  </div>
                  <span className="text-[13px] font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-heading)' }}>
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: '1px solid var(--border-field)', background: 'var(--surface-field)' }}>
                <span className="text-[13px] font-bold" style={{ color: 'var(--text-label)' }}>Saldo sistema</span>
                <span className="text-[14px] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-heading)' }}>
                  {formatCurrency(systemTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Counted balance input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Saldo contado en caja
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
              <Input
                type="number"
                min={0}
                className="pl-6 text-[15px]"
                placeholder="0"
                value={counted}
                onChange={e => setCounted(e.target.value)}
                autoFocus
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
          </div>

          {/* Difference */}
          {counted !== '' && (
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{
                background: diff === 0 ? '#F0FDF4' : diff > 0 ? '#EFF6FF' : '#FEF2F2',
                border: `1px solid ${diff === 0 ? '#BBF7D0' : diff > 0 ? '#BFDBFE' : '#FECACA'}`,
              }}
            >
              <span className="text-[13px] font-semibold" style={{ color: diff === 0 ? '#16A34A' : diff > 0 ? '#1D4ED8' : '#DC2626' }}>
                {diff === 0 ? 'Sin diferencia' : diff > 0 ? 'Sobrante' : 'Faltante'}
              </span>
              <span
                className="text-[15px] font-bold"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: diff === 0 ? '#16A34A' : diff > 0 ? '#1D4ED8' : '#DC2626' }}
              >
                {diff !== 0 && (diff > 0 ? '+' : '')}{formatCurrency(diff)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Notas <span className="font-normal" style={{ color: 'var(--text-hint)' }}>(opcional)</span>
            </label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-[13px] resize-none bg-transparent"
              style={{ border: '1px solid var(--border-field)', outline: 'none', color: 'var(--text-heading)', minHeight: 64 }}
              placeholder="Observaciones del turno..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              style={{ background: '#EF4444' }}
              disabled={!counted}
            >
              <Lock size={14} />
              Cerrar Turno
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
