import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParkingSquare, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Email o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-[420px] shrink-0 px-10 pt-9 pb-8 bg-[#09101F]">
        <div className="flex-1 flex flex-col justify-center gap-10">

          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 shadow-[0_2px_16px_rgba(245,158,11,0.28)]"
              style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' }}
            >
              <ParkingSquare size={18} className="text-[#09101F]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-[18px] leading-none tracking-tight">
                ParkAdmin
              </p>
              <p className="text-[10px] font-semibold leading-none mt-1.5 uppercase tracking-[0.13em] text-[#2D4159]">
                Sistema de gestión
              </p>
            </div>
          </div>

          {/* Tagline + features */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="text-[28px] font-bold leading-tight text-slate-50">
                Control total de tu estacionamiento
              </p>
              <p className="text-[14px] leading-normal text-[#5A7190]">
                Gestioná entradas, salidas, turnos, tarifas y abonos desde un solo panel.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                'Registro de entradas y salidas en tiempo real',
                'Control de turnos por operador',
                'Gestión de abonos mensuales',
                'Auditoría completa del sistema',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-signal" />
                  <span className="text-[14px] text-[#6B8299]">{f}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <p className="text-[11px] text-[#2A3D52]">© 2025 ParkAdmin — Todos los derechos reservados</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-slate-50 dark:bg-canvas">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-signal">
              <ParkingSquare size={18} className="text-ink" strokeWidth={2.5} />
            </div>
            <p className="font-bold text-[16px] text-ink">ParkAdmin</p>
          </div>

          <div className="mb-7">
            <h1 className="text-[24px] font-bold text-ink">Iniciar sesión</h1>
            <p className="text-[14px] mt-1 text-slate-400">Ingresá tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-gray-700 dark:text-slate-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@parking.com"
                required
                autoFocus
                className="h-10 rounded-lg px-3 text-[14px] text-ink bg-white border border-slate-200 outline-none transition-all focus:border-signal dark:bg-zinc-800 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-gray-700 dark:text-slate-200">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 rounded-lg px-3 pr-10 text-[14px] text-ink bg-white border border-slate-200 outline-none transition-all focus:border-signal dark:bg-zinc-800 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span className="text-[13px] text-red-600">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 rounded-lg font-semibold text-[14px] transition-opacity disabled:opacity-60 bg-signal text-ink"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
