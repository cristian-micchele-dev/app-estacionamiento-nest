import { createContext, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toasts: Toast[]
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function push(type: ToastType, message: string) {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const toast = {
    success: (message: string) => push('success', message),
    error:   (message: string) => push('error', message),
    info:    (message: string) => push('info', message),
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
