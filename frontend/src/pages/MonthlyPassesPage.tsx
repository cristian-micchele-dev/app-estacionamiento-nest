import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, IdCard, CheckCircle, XCircle, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import MonthlyPassModal, { type MonthlyPassFormData } from '@/components/monthly-passes/MonthlyPassModal'
import { monthlyPassesService, type MonthlyPassApi } from '@/services/monthly-passes.service'
import { vehiclesService } from '@/services/vehicles.service'
import { formatCurrency } from '@/lib/format'

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  CAR: 'Auto', MOTORCYCLE: 'Moto', TRUCK: 'Camión', VAN: 'Camioneta', BUS: 'Bus',
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function isExpired(validTo: string) {
  return new Date(validTo + 'T23:59:59') < new Date()
}

function daysLeft(validTo: string) {
  const diff = new Date(validTo + 'T23:59:59').getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

const STAT_CARDS = (active: number, expired: number, total: number) => [
  { label: 'Abonos activos',   value: active,  iconColor: 'text-cyan-600',  iconBg: 'bg-cyan-50'  },
  { label: 'Vencidos / bajas', value: expired, iconColor: 'text-slate-400', iconBg: 'bg-slate-100' },
  { label: 'Total abonos',     value: total,   iconColor: 'text-ink',       iconBg: 'bg-slate-50'  },
]

export default function MonthlyPassesPage() {
  const [passes, setPasses] = useState<MonthlyPassApi[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MonthlyPassApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MonthlyPassApi | null>(null)

  useEffect(() => {
    monthlyPassesService.findAll().then(setPasses).finally(() => setLoading(false))
  }, [])

  const active  = passes.filter(p => p.isActive && !isExpired(p.validTo))
  const expired = passes.filter(p => !p.isActive || isExpired(p.validTo))

  async function handleAdd(data: MonthlyPassFormData) {
    const vehicles = await vehiclesService.findAll()
    let vehicle = vehicles.find(v => v.plate === data.plate.toUpperCase())
    if (!vehicle) {
      vehicle = await vehiclesService.create({ plate: data.plate.toUpperCase(), type: data.vehicleType as 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'VAN' | 'BUS' })
    }
    const created = await monthlyPassesService.create({
      vehicleId: vehicle.id,
      holderName: data.holderName,
      holderPhone: data.holderPhone,
      holderEmail: data.holderEmail,
      validFrom: data.validFrom,
      validTo: data.validTo,
      pricePaid: data.pricePaid,
      isActive: data.isActive,
      notes: data.notes,
    })
    setPasses(prev => [created, ...prev])
  }

  async function handleEdit(data: MonthlyPassFormData) {
    if (!editTarget) return
    const updated = await monthlyPassesService.update(editTarget.id, {
      holderName: data.holderName,
      holderPhone: data.holderPhone,
      holderEmail: data.holderEmail,
      validFrom: data.validFrom,
      validTo: data.validTo,
      pricePaid: data.pricePaid,
      isActive: data.isActive,
      notes: data.notes,
    })
    setPasses(prev => prev.map(p => p.id === editTarget.id ? updated : p))
    setEditTarget(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await monthlyPassesService.remove(deleteTarget.id)
    setPasses(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Abonos Mensuales</h1>
          <p className="text-sm mt-0.5 text-slate-400">Gestión de abonos y clientes frecuentes</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 font-semibold bg-cyan-600 hover:bg-cyan-700">
          <Plus size={15} />
          Nuevo Abono
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS(active.length, expired.length, passes.length).map(({ label, value, iconColor, iconBg }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-card">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconBg}`}>
              <IdCard size={16} className={iconColor} />
            </div>
            <div>
              <p className="font-mono text-[22px] font-bold leading-none text-ink">{value}</p>
              <p className="text-[11px] mt-1 text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading && (
          <p className="text-[13px] col-span-2 text-slate-400">Cargando...</p>
        )}
        {passes.map(pass => {
          const expired_ = isExpired(pass.validTo)
          const days     = daysLeft(pass.validTo)
          const isValid  = pass.isActive && !expired_

          return (
            <div
              key={pass.id}
              className={`bg-white rounded-xl p-5 flex flex-col gap-3 shadow-card ${isValid ? '' : 'opacity-65'}`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${isValid ? 'bg-cyan-50' : 'bg-slate-100'}`}>
                    <IdCard size={17} className={isValid ? 'text-cyan-600' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-ink">{pass.holderName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[12px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-gray-700">
                        {pass.vehicle.plate}
                      </span>
                      <span className="text-[11px] text-slate-400">{VEHICLE_TYPE_LABEL[pass.vehicle.type]}</span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                {isValid ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600">
                    <CheckCircle size={11} />
                    {days <= 5 ? `Vence en ${days}d` : 'Vigente'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                    <XCircle size={11} />
                    {!pass.isActive ? 'Baja' : 'Vencido'}
                  </span>
                )}
              </div>

              {/* Validity row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg p-2.5 text-center bg-slate-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-slate-400">Desde</p>
                  <p className="font-mono text-[13px] font-bold text-ink">{formatDate(pass.validFrom)}</p>
                </div>
                <div className="rounded-lg p-2.5 text-center bg-slate-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-slate-400">Hasta</p>
                  <p className={`font-mono text-[13px] font-bold ${expired_ ? 'text-red-600' : 'text-ink'}`}>
                    {formatDate(pass.validTo)}
                  </p>
                </div>
                <div className="rounded-lg p-2.5 text-center bg-slate-50">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-slate-400">Abonado</p>
                  <p className="font-mono text-[13px] font-bold text-ink">{formatCurrency(pass.pricePaid)}</p>
                </div>
              </div>

              {/* Contact & notes */}
              {(pass.holderPhone || pass.holderEmail || pass.notes) && (
                <div className="flex flex-wrap gap-2">
                  {pass.holderPhone && (
                    <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      <Phone size={10} /> {pass.holderPhone}
                    </span>
                  )}
                  {pass.holderEmail && (
                    <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      <Mail size={10} /> {pass.holderEmail}
                    </span>
                  )}
                  {pass.notes && (
                    <span className="text-[11px] italic text-slate-400">{pass.notes}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-[12px]"
                  onClick={() => { setEditTarget(pass); setModalOpen(true) }}
                >
                  <Pencil size={12} /> Editar
                </Button>
                <Button
                  variant="outline" size="sm" className="gap-1.5 text-[12px] ml-auto border-red-300 text-red-500 hover:bg-red-50"
                  onClick={() => setDeleteTarget(pass)}
                >
                  <Trash2 size={12} /> Eliminar
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <MonthlyPassModal
        open={modalOpen}
        pass={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onConfirm={editTarget ? handleEdit : handleAdd}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar abono?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el abono de <strong>{deleteTarget?.holderName}</strong> ({deleteTarget?.vehicle.plate}).
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
