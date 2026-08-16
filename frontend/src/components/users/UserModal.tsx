import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserCog } from 'lucide-react'
import type { UserApi } from '@/services/users.service'

type UserRole = 'ADMIN' | 'SUPERVISOR' | 'CASHIER'

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  CASHIER: 'Cajero',
}

export interface UserFormData {
  name: string
  email: string
  password?: string
  role: UserRole
  isActive: boolean
}

interface UserModalProps {
  open: boolean
  user: UserApi | null
  onClose: () => void
  onConfirm: (data: UserFormData) => void | Promise<void>
}

const EMPTY: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'CASHIER',
  isActive: true,
}

const ROLES: UserRole[] = ['ADMIN', 'SUPERVISOR', 'CASHIER']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>{label}</label>
      {children}
    </div>
  )
}

export default function UserModal({ open, user, onClose, onConfirm }: UserModalProps) {
  const [form, setForm] = useState<UserFormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(user
      ? { name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive }
      : EMPTY
    )
  }, [user, open])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onConfirm(form)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = !!user

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--icon-bg-purple)' }}>
              <UserCog size={16} style={{ color: '#7C3AED' }} />
            </div>
            <DialogTitle className="text-[16px] font-bold" style={{ color: 'var(--text-heading)' }}>
              {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Field label="Nombre *">
            <Input
              placeholder="Nombre del operador"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              autoFocus={!isEdit}
            />
          </Field>

          <Field label="Email *">
            <Input
              type="email"
              placeholder="usuario@parking.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              disabled={isEdit}
            />
          </Field>

          {!isEdit && (
            <Field label="Contraseña *">
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password ?? ''}
                onChange={e => set('password', e.target.value)}
                required={!isEdit}
                minLength={8}
              />
            </Field>
          )}

          <Field label="Rol">
            <div className="flex gap-2">
              {ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => set('role', role)}
                  className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: form.role === role
                      ? role === 'ADMIN' ? 'var(--icon-bg-red)' : role === 'SUPERVISOR' ? 'var(--icon-bg-purple)' : 'var(--icon-bg-blue)'
                      : 'var(--surface-field)',
                    color: form.role === role
                      ? role === 'ADMIN' ? '#DC2626' : role === 'SUPERVISOR' ? '#7C3AED' : '#2563EB'
                      : 'var(--text-muted)',
                    border: `1.5px solid ${form.role === role
                      ? role === 'ADMIN' ? '#FECACA' : role === 'SUPERVISOR' ? '#DDD6FE' : '#BFDBFE'
                      : 'var(--border-field)'}`,
                  }}
                >
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </div>
          </Field>

          {/* Active toggle */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'var(--surface-field)', border: '1px solid var(--border-field)' }}>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-label)' }}>Usuario activo</p>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className="relative w-10 h-6 rounded-full transition-colors"
              style={{ background: form.isActive ? '#7C3AED' : 'var(--toggle-off)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm"
                style={{ transform: form.isActive ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              style={{ background: '#7C3AED' }}
              disabled={submitting || !form.name.trim() || !form.email.trim() || (!isEdit && (form.password ?? '').length < 8)}
            >
              {submitting && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
