import { useState } from 'react'
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { profileService } from '@/services/profile.service'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  CASHIER: 'Cajero',
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const { toast } = useToast()

  const [name,  setName]  = useState(user?.name  ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword,  setCurrentPassword]  = useState('')
  const [newPassword,      setNewPassword]      = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [showCurrent,      setShowCurrent]      = useState(false)
  const [showNew,          setShowNew]          = useState(false)
  const [savingPassword,   setSavingPassword]   = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Nombre y email son obligatorios')
      return
    }
    setSavingProfile(true)
    try {
      await profileService.update({ name: name.trim(), email: email.trim() })
      await refreshProfile()
      toast.success('Perfil actualizado')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg === 'EMAIL_ALREADY_EXISTS' ? 'Ese email ya está en uso' : 'No se pudo actualizar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setSavingPassword(true)
    try {
      await profileService.changePassword({ currentPassword, newPassword })
      toast.success('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg === 'INVALID_CURRENT_PASSWORD' ? 'La contraseña actual es incorrecta' : 'No se pudo cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const passwordMismatch = Boolean(confirmPassword && confirmPassword !== newPassword)

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-ink">Mi perfil</h1>
        <p className="text-sm mt-0.5 text-slate-400">Administrá tu información personal y seguridad</p>
      </div>

      {/* Avatar + role card */}
      <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-card">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl text-xl font-bold shrink-0 bg-[#1E3A5F] text-[#7EB8F7]">
          {user?.name?.slice(0, 2).toUpperCase() ?? '??'}
        </div>
        <div>
          <p className="text-[17px] font-bold text-ink">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
            {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Personal data */}
      <div className="bg-white rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-blue-500" />
          <p className="text-[14px] font-semibold text-gray-700">Datos personales</p>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-800 outline-none focus:ring-2 dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-800 outline-none focus:ring-2 dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={savingProfile} className="gap-2 font-semibold bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
              <Save size={14} />
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={15} className="text-signal" />
          <p className="text-[14px] font-semibold text-gray-700">Cambiar contraseña</p>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 text-slate-800 outline-none focus:ring-2 dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 text-slate-800 outline-none focus:ring-2 dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`px-3 py-2 text-sm rounded-lg border text-slate-800 outline-none focus:ring-2 ${
                passwordMismatch ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {passwordMismatch && (
              <p className="text-[12px] text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="gap-2 font-semibold bg-signal hover:bg-signal-dark text-ink"
            >
              <Lock size={14} />
              {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
