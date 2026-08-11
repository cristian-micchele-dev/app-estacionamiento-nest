import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Tag, Moon, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import TariffModal from '@/components/tariffs/TariffModal'
import { tariffsService, type TariffApi } from '@/services/tariffs.service'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/contexts/ToastContext'

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

function formatPrice(n: number | null): string {
  if (n === null) return '—'
  return formatCurrency(n)
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr + 'T00:00:00'), "d 'de' MMM. yyyy", { locale: es })
  } catch {
    return dateStr
  }
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 flex flex-col gap-4 animate-pulse shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl shrink-0 bg-slate-100" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-32 rounded-full bg-slate-100" />
            <div className="h-2.5 w-24 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg p-3 flex flex-col items-center gap-2 bg-slate-50">
            <div className="h-5 w-16 rounded-full bg-slate-200" />
            <div className="h-2 w-10 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

const STAT_CARDS = (active: number, inactive: number, maxPrice: number | null, loading: boolean) => [
  { label: 'Tarifas activas',   value: loading ? '—' : String(active),   icon: Tag,      iconColor: 'text-green-500', iconBg: 'bg-green-50'  },
  { label: 'Tarifas inactivas', value: loading ? '—' : String(inactive), icon: Clock,    iconColor: 'text-slate-400', iconBg: 'bg-slate-100' },
  { label: 'Precio más alto',   value: loading ? '—' : maxPrice !== null ? `$${maxPrice.toLocaleString('es-AR')}/h` : '—', icon: TrendingUp, iconColor: 'text-signal-dark', iconBg: 'bg-signal/10' },
]

export default function TariffsPage() {
  const [tariffs, setTariffs]         = useState<TariffApi[]>([])
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState<TariffApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TariffApi | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    tariffsService.findAll()
      .then(data => setTariffs(data))
      .catch(() => toast.error('No se pudieron cargar las tarifas'))
      .finally(() => setLoading(false))
  }, [])

  const active   = tariffs.filter(t => t.isActive)
  const inactive = tariffs.filter(t => !t.isActive)
  const maxPrice = tariffs.length > 0 ? Math.max(...tariffs.map(t => t.pricePerHour)) : null

  async function handleAdd(data: Omit<TariffApi, 'id'>) {
    try {
      const created = await tariffsService.create({
        ...data,
        effectiveFrom: typeof data.effectiveFrom === 'string' ? data.effectiveFrom : (data.effectiveFrom as Date).toISOString().slice(0, 10),
        effectiveTo: data.effectiveTo ? (typeof data.effectiveTo === 'string' ? data.effectiveTo : (data.effectiveTo as Date).toISOString().slice(0, 10)) : null,
      })
      setTariffs(prev => [created, ...prev])
      toast.success('Tarifa creada')
    } catch (err: any) {
      const code = err?.response?.data?.message
      if (code === 'MAX_TARIFFS_REACHED') {
        toast.error('Límite alcanzado: solo se permiten 3 tarifas (24hs, día y noche)')
      } else {
        toast.error('No se pudo crear la tarifa')
      }
    }
  }

  async function handleEdit(data: Omit<TariffApi, 'id'>) {
    if (!editTarget) return
    try {
      const updated = await tariffsService.update(editTarget.id, {
        ...data,
        effectiveFrom: typeof data.effectiveFrom === 'string' ? data.effectiveFrom : (data.effectiveFrom as Date).toISOString().slice(0, 10),
        effectiveTo: data.effectiveTo ? (typeof data.effectiveTo === 'string' ? data.effectiveTo : (data.effectiveTo as Date).toISOString().slice(0, 10)) : null,
      })
      setTariffs(prev => prev.map(t => t.id === editTarget.id ? updated : t))
      setEditTarget(null)
      toast.success('Tarifa actualizada')
    } catch {
      toast.error('No se pudo actualizar la tarifa')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await tariffsService.remove(deleteTarget.id)
      setTariffs(prev => prev.filter(t => t.id !== deleteTarget.id))
      toast.success('Tarifa eliminada')
    } catch {
      toast.error('No se pudo eliminar la tarifa')
    } finally {
      setDeleteTarget(null)
    }
  }

  async function toggleActive(id: string) {
    const tariff = tariffs.find(t => t.id === id)
    if (!tariff) return
    setTariffs(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t))
    try {
      const updated = await tariffsService.update(id, { isActive: !tariff.isActive })
      setTariffs(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      setTariffs(prev => prev.map(t => t.id === id ? tariff : t))
      toast.error('No se pudo cambiar el estado de la tarifa')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Tarifas</h1>
          <p className="text-sm mt-0.5 text-slate-400">Configuración de precios por tipo de vehículo</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          disabled={tariffs.length >= 3}
          title={tariffs.length >= 3 ? 'Límite de 3 tarifas alcanzado' : undefined}
          className="gap-2 font-semibold bg-signal hover:bg-signal-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={15} />
          Nueva Tarifa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS(active.length, inactive.length, maxPrice, loading).map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-card">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconBg}`}>
              <Icon size={16} className={iconColor} strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-mono text-[20px] font-bold leading-none text-ink">{value}</p>
              <p className="text-[11px] mt-1 text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tariff cards */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {!loading && tariffs.length === 0 && (
        <div className="bg-white rounded-xl flex flex-col items-center justify-center py-16 gap-3 shadow-card">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-signal/10">
            <Tag size={22} className="text-signal-dark" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-semibold text-gray-700">No hay tarifas configuradas</p>
          <p className="text-[13px] text-slate-400">Creá la primera tarifa para empezar a registrar entradas</p>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={tariffs.length >= 3}
            className="mt-2 gap-2 font-semibold bg-signal hover:bg-signal-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Nueva Tarifa
          </Button>
        </div>
      )}

      {!loading && tariffs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tariffs.map(tariff => (
            <div
              key={tariff.id}
              className={`bg-white rounded-xl p-5 flex flex-col gap-4 shadow-card ${tariff.isActive ? '' : 'opacity-60'}`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${tariff.isActive ? 'bg-signal/10' : 'bg-slate-100'}`}>
                    <Tag size={15} className={tariff.isActive ? 'text-signal-dark' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-ink">{tariff.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Desde {formatDate(tariff.effectiveFrom)}{tariff.effectiveTo ? ` · Hasta ${formatDate(tariff.effectiveTo)}` : ''}
                    </p>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(tariff.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${tariff.isActive ? 'bg-green-500' : 'bg-slate-200'}`}
                    title={tariff.isActive ? 'Desactivar' : 'Activar'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                        tariff.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-[11px] font-semibold ${tariff.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                    {tariff.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              {/* Prices grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg p-3 text-center bg-slate-50">
                  <p className="font-mono text-[18px] font-bold text-ink">{formatPrice(tariff.pricePerHour)}</p>
                  <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide text-slate-400">por hora</p>
                </div>
                <div className="rounded-lg p-3 text-center bg-slate-50">
                  <p className="font-mono text-[18px] font-bold text-ink">{formatPrice(tariff.pricePerHalfHour)}</p>
                  <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide text-slate-400">media hora</p>
                </div>
                <div className="rounded-lg p-3 text-center bg-slate-50">
                  <p className="font-mono text-[18px] font-bold text-ink">{formatPrice(tariff.dailyMax)}</p>
                  <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide text-slate-400">máx. diario</p>
                </div>
              </div>

              {/* Extra rules */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                  <Clock size={11} />
                  {tariff.toleranceMinutes} min tolerancia
                </span>
                {tariff.overnightRate !== null && (
                  <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                    <Moon size={11} />
                    {formatHour(tariff.overnightStartHour)}–{formatHour(tariff.overnightEndHour)} · {formatPrice(tariff.overnightRate)}/h
                  </span>
                )}
              </div>

              {/* Card actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-[12px]"
                  onClick={() => { setEditTarget(tariff); setModalOpen(true) }}
                >
                  <Pencil size={12} /> Editar
                </Button>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-[12px] ml-auto border-red-300 text-red-500 hover:bg-red-50"
                  onClick={() => setDeleteTarget(tariff)}
                >
                  <Trash2 size={12} /> Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TariffModal
        open={modalOpen}
        tariff={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onConfirm={editTarget ? handleEdit : handleAdd}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarifa?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la tarifa <strong>{deleteTarget?.name}</strong>. Las sesiones existentes no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
