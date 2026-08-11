import { useState, useMemo, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LogOut, Clock, Banknote } from 'lucide-react'
import {
  PAYMENT_METHOD_LABEL,
  VEHICLE_TYPE_LABEL,
  formatElapsed,
  formatTime,
  type PaymentMethod,
} from '@/data/parking.data'

export interface SessionForExit {
  id: string
  plate: string
  vehicleType: string
  ticketNumber: string
  entryTime: Date
  tariffName: string
  pricePerHour: number
  toleranceMinutes: number
}

interface ExitModalProps {
  open: boolean
  session: SessionForExit | null
  onClose: () => void
  onConfirm: (sessionId: string, paymentMethod: PaymentMethod, receivedAmount?: number) => Promise<void>
}

export default function ExitModal({ open, session, onClose, onConfirm }: ExitModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const receivedRef = useRef<HTMLInputElement>(null)

  const amount = useMemo(() => {
    if (!session) return 0
    const minutes = Math.floor((Date.now() - session.entryTime.getTime()) / 60000)
    if (minutes <= (session.toleranceMinutes ?? 10)) return 0
    return Math.round((minutes / 60) * Number(session.pricePerHour))
  }, [session])

  const change = useMemo(() => {
    const received = parseInt(receivedAmount, 10)
    if (isNaN(received)) return null
    return received - amount
  }, [receivedAmount, amount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setLoading(true)
    try {
      const received = paymentMethod === 'CASH' ? parseInt(receivedAmount, 10) : undefined
      await onConfirm(session.id, paymentMethod, received)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setPaymentMethod('CASH')
    setReceivedAmount('')
    onClose()
  }

  if (!session) return null

  const elapsed = formatElapsed(session.entryTime)
  const diffMinutes = Math.floor((new Date().getTime() - session.entryTime.getTime()) / 60000)
  const hours = Math.ceil(diffMinutes / 60)
  const isCash = paymentMethod === 'CASH'
  const changeOk = !isCash || (change !== null && change >= 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={e => { e.preventDefault(); receivedRef.current?.focus() }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-red)' }}>
              <LogOut size={16} style={{ color: '#EF4444' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              Registrar Salida
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Session summary */}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--surface-field)', border: '1px solid var(--border-field)' }}>
            <div className="flex items-center justify-between">
              <span
                className="text-[20px] font-bold tracking-widest"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-heading)' }}
              >
                {session.plate}
              </span>
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)' }}>
                {VEHICLE_TYPE_LABEL[session.vehicleType]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Ticket</p>
                <p className="text-[12px] font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                  {session.ticketNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Ingresó</p>
                <p className="text-[12px] font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                  {formatTime(session.entryTime)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Tiempo</p>
                <div className="flex items-center gap-1">
                  <Clock size={11} style={{ color: '#F59E0B' }} />
                  <p className="text-[12px] font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                    {elapsed}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-field)' }}>
              <div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {session.tariffName} · {hours}h × ${session.pricePerHour.toLocaleString('es-AR')}/h
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Banknote size={14} style={{ color: '#16A34A' }} />
                <span
                  className="text-[22px] font-bold"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: '#16A34A' }}
                >
                  ${amount.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Método de pago
            </label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cash: received amount + change */}
          {isCash && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
                  Monto recibido
                </label>
                <Input
                  ref={receivedRef}
                  type="number"
                  step="1"
                  placeholder={`Mínimo $${amount.toLocaleString('es-AR')}`}
                  value={receivedAmount}
                  onChange={e => setReceivedAmount(e.target.value.replace(/[.,].*/, ''))}
                  min={amount}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>
              {change !== null && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: change >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${change >= 0 ? '#86EFAC' : '#FCA5A5'}` }}
                >
                  <span className="text-[13px] font-semibold" style={{ color: change >= 0 ? '#15803D' : '#DC2626' }}>
                    {change >= 0 ? 'Vuelto a entregar' : 'Monto insuficiente'}
                  </span>
                  <span
                    className="text-[18px] font-bold"
                    style={{ fontFamily: 'JetBrains Mono, monospace', color: change >= 0 ? '#15803D' : '#DC2626' }}
                  >
                    ${Math.abs(change).toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              style={{ background: '#EF4444' }}
              disabled={(isCash && !changeOk) || loading}
            >
              <LogOut size={14} />
              Confirmar Salida
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
