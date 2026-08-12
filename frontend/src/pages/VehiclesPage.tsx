import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, Car, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import VehicleModal from '@/components/vehicles/VehicleModal'
import { VEHICLE_TYPE_LABEL, VEHICLE_TYPE_STYLE, COLOR_SWATCHES } from '@/data/vehicles.data'
import { vehiclesService, type VehicleApi, type VehicleType } from '@/services/vehicles.service'
import { useVehicles } from '@/hooks/useVehicles'
import { getPaginationPages } from '@/lib/pagination'
import { useToast } from '@/contexts/ToastContext'

const PAGE_SIZE = 20

type TypeFilter = VehicleType | ''

export default function VehiclesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('')
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VehicleApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VehicleApi | null>(null)
  const { toast } = useToast()

  const { vehicles, loading, total, totalPages } = useVehicles({
    search: search || undefined,
    type: typeFilter || undefined,
    page,
    limit: PAGE_SIZE,
    refreshKey,
  })

  function refresh() {
    setPage(1)
    setRefreshKey(k => k + 1)
  }

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  function handleType(val: string | null) {
    setTypeFilter((val ?? '') as TypeFilter)
    setPage(1)
  }

  async function handleAdd(data: Omit<VehicleApi, 'id' | 'createdAt'>) {
    try {
      await vehiclesService.create(data)
      toast.success('Vehículo agregado')
      refresh()
    } catch {
      toast.error('No se pudo agregar el vehículo')
    }
  }

  async function handleEdit(data: Omit<VehicleApi, 'id' | 'createdAt'>) {
    if (!editTarget) return
    try {
      await vehiclesService.update(editTarget.id, data)
      toast.success('Vehículo actualizado')
      setEditTarget(null)
      refresh()
    } catch {
      toast.error('No se pudo actualizar el vehículo')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await vehiclesService.remove(deleteTarget.id)
      toast.success('Vehículo eliminado')
      setDeleteTarget(null)
      refresh()
    } catch {
      toast.error('No se pudo eliminar el vehículo')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Vehículos</h1>
          <p className="text-sm mt-0.5 text-slate-400">Padrón de vehículos registrados</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 font-semibold bg-blue-500 hover:bg-blue-600">
          <Plus size={15} />
          Agregar Vehículo
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-card">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3.5 flex-wrap border-b border-slate-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por patente, marca, color..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          <Select value={typeFilter} onValueChange={handleType}>
            <SelectTrigger className="w-36 text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="CAR">Automóvil</SelectItem>
              <SelectItem value="MOTORCYCLE">Motocicleta</SelectItem>
              <SelectItem value="TRUCK">Camión</SelectItem>
              <SelectItem value="VAN">Camioneta</SelectItem>
              <SelectItem value="BUS">Colectivo</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-[12px] ml-auto text-slate-400">
            {total} vehículo{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Patente', 'Tipo', 'Marca', 'Color', ''].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-slate-300">Cargando...</td></tr>
              )}
              {!loading && vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-300">
                    <div className="flex flex-col items-center gap-2">
                      <Car size={28} strokeWidth={1.25} />
                      <span className="text-sm">No se encontraron vehículos</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && vehicles.map(vehicle => {
                const typeStyle = VEHICLE_TYPE_STYLE[vehicle.type] ?? { bg: 'bg-slate-100', text: 'text-slate-500' }
                const colorHex = vehicle.color ? COLOR_SWATCHES[vehicle.color] : null

                return (
                  <tr key={vehicle.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[14px] font-bold tracking-widest text-ink">
                        {vehicle.plate}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                        {VEHICLE_TYPE_LABEL[vehicle.type] ?? vehicle.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[13px] ${vehicle.brand ? 'text-gray-700' : 'text-slate-300'}`}>
                        {vehicle.brand ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {vehicle.color ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border shrink-0"
                            style={{ background: colorHex ?? '#E2E8F0', borderColor: vehicle.color === 'Blanco' ? '#E2E8F0' : colorHex ?? '#E2E8F0' }}
                          />
                          <span className="text-[13px] text-gray-700">{vehicle.color}</span>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditTarget(vehicle); setModalOpen(true) }}
                          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 text-slate-500"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(vehicle)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-[12px] text-slate-400">Página {page} de {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
              >
                <ChevronLeft size={14} />
              </button>

              {getPaginationPages(page, totalPages).map((p, i) =>
                p === '...'
                  ? <span key={`e-${i}`} className="flex items-center justify-center w-7 h-7 text-slate-300"><MoreHorizontal size={14} /></span>
                  : <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p}
                    </button>
              )}

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <VehicleModal
        open={modalOpen}
        vehicle={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onConfirm={editTarget ? handleEdit : handleAdd}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong className="font-mono">{deleteTarget?.plate}</strong> del padrón.
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
