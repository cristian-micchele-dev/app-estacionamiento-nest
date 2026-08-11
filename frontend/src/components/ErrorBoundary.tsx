import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[17px] font-bold text-ink">Algo salió mal</p>
            <p className="text-sm text-slate-400">
              Ocurrió un error inesperado. Podés intentar recargar la página.
            </p>
          </div>
          <details className="w-full text-left">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
              Ver detalle del error
            </summary>
            <pre className="mt-2 p-3 rounded-lg text-[11px] text-red-600 bg-red-50 overflow-auto max-h-40 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-ink text-white hover:opacity-90"
          >
            <RefreshCw size={14} />
            Recargar página
          </button>
        </div>
      </div>
    )
  }
}
