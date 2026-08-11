import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

interface OpenShiftModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (openingBalance: number) => void
}

export default function OpenShiftModal({ open, onClose, onConfirm }: OpenShiftModalProps) {
  const [balance, setBalance] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(parseFloat(balance) || 0)
    setBalance('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-green)' }}>
              <Clock size={16} style={{ color: '#22C55E' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              Abrir Turno
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--surface-field)', border: '1px solid var(--border-field)' }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Operador</p>
            <p className="text-[15px] font-bold" style={{ color: 'var(--text-heading)' }}>Administrador</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>
              Saldo inicial de caja
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
              <Input
                type="number"
                min={0}
                className="pl-6 text-[15px]"
                placeholder="0"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                autoFocus
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Contá el efectivo en caja antes de comenzar.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 gap-2" style={{ background: '#22C55E' }}>
              <Clock size={14} />
              Abrir Turno
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
