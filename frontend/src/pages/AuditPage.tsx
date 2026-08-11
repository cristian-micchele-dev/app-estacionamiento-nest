import { useState, useEffect, useMemo } from 'react'
import { Search, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { auditService, type AuditLogApi } from '@/services/audit.service'
import { ACTION_LABEL, ACTION_COLOR, type AuditAction } from '@/data/audit.data'

function formatDate(d: string) {
  return new Date(d).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(d: string): string {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

const ALL_ACTIONS = Object.keys(ACTION_LABEL) as AuditAction[]

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogApi[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('')

  useEffect(() => {
    auditService.findAll(200).then(setLogs).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchesAction = !filterAction || log.action === filterAction
      const matchesSearch = !search ||
        log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.entityId.toLowerCase().includes(search.toLowerCase()) ||
        ACTION_LABEL[log.action as AuditAction]?.toLowerCase().includes(search.toLowerCase())
      return matchesAction && matchesSearch
    })
  }, [logs, search, filterAction])

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Auditoría</h1>
          <p className="text-sm mt-0.5 text-slate-400">Registro completo de acciones del sistema</p>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-500">
          <Shield size={14} />
          {logs.length} eventos registrados
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-8 text-[13px]"
            placeholder="Buscar por usuario, entidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value as AuditAction | '')}
          className="h-9 rounded-md border border-slate-200 px-3 text-[13px] text-gray-700 bg-white dark:bg-white/[0.06] dark:border-white/10 dark:text-slate-100"
        >
          <option value="">Todas las acciones</option>
          {ALL_ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
        </select>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP', 'Detalle'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-slate-400">Cargando...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-slate-400">No se encontraron registros</td></tr>
            )}
            {filtered.map((log, i) => {
              const actionStyle = ACTION_COLOR[log.action as AuditAction] ?? { text: 'text-slate-500', bg: 'bg-slate-100' }
              return (
                <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[12px] text-gray-700">{formatDate(log.createdAt)}</p>
                    <p className="text-[10px] mt-0.5 text-slate-400">{timeAgo(log.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-ink">
                    {log.user?.name ?? <span className="text-slate-400">Sistema</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${actionStyle.bg} ${actionStyle.text}`}>
                      {ACTION_LABEL[log.action as AuditAction] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{log.entityType}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] text-slate-400">{log.entityId}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{log.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[200px]">
                    {log.metadata ? Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
