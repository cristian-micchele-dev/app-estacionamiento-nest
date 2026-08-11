import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

const CONFIG = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-600',
    wrapperClass: 'bg-green-50 border border-green-200',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-600',
    wrapperClass: 'bg-red-50 border border-red-200',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-600',
    wrapperClass: 'bg-blue-50 border border-blue-200',
  },
}

export default function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => {
        const cfg = CONFIG[t.type]
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto max-w-sm w-full ${cfg.wrapperClass}`}
            style={{ animation: 'slide-in-from-right 0.2s ease-out' }}
          >
            <Icon size={17} className={`${cfg.iconClass} mt-px shrink-0`} aria-hidden="true" />
            <p className="flex-1 text-sm font-medium text-slate-800">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar notificación"
              className="shrink-0 text-slate-400 hover:opacity-60 transition-opacity"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
