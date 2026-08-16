import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, UserCog, ShieldCheck, Users } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import UserModal, { type UserFormData } from '@/components/users/UserModal'
import { usersService, type UserApi } from '@/services/users.service'
import { useAuth } from '@/contexts/AuthContext'

type UserRole = 'ADMIN' | 'SUPERVISOR' | 'CASHIER'

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  CASHIER: 'Cajero',
}

const ROLE_STYLE: Record<UserRole, { bg: string; text: string }> = {
  ADMIN:      { bg: 'bg-red-50',    text: 'text-red-600'    },
  SUPERVISOR: { bg: 'bg-violet-50', text: 'text-violet-600' },
  CASHIER:    { bg: 'bg-blue-50',   text: 'text-blue-600'   },
}

const STAT_CARDS = [
  { label: 'Usuarios activos',  key: 'active',      iconColor: 'text-violet-600', iconBg: 'bg-violet-50', icon: Users      },
  { label: 'Administradores',   key: 'admins',      iconColor: 'text-red-600',    iconBg: 'bg-red-50',    icon: ShieldCheck },
  { label: 'Supervisores',      key: 'supervisors', iconColor: 'text-violet-600', iconBg: 'bg-violet-50', icon: UserCog    },
  { label: 'Cajeros',           key: 'cashiers',    iconColor: 'text-blue-600',   iconBg: 'bg-blue-50',   icon: Users      },
] as const

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'ADMIN'
  const { toast } = useToast()
  const [users, setUsers] = useState<UserApi[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserApi | null>(null)

  useEffect(() => {
    usersService.findAll().then(setUsers).finally(() => setLoading(false))
  }, [])

  const active      = users.filter(u => u.isActive)
  const admins      = users.filter(u => u.role === 'ADMIN')
  const supervisors = users.filter(u => u.role === 'SUPERVISOR')
  const cashiers    = users.filter(u => u.role === 'CASHIER')

  const statValues: Record<string, number> = {
    active: active.length,
    admins: admins.length,
    supervisors: supervisors.length,
    cashiers: cashiers.length,
  }

  async function handleAdd(data: UserFormData) {
    try {
      const created = await usersService.create({
        name: data.name,
        email: data.email,
        password: data.password!,
        role: data.role,
      })
      setUsers(prev => [...prev, created])
      toast.success('Usuario creado')
    } catch (err: any) {
      const code = err?.response?.data?.message
      toast.error(code === 'EMAIL_ALREADY_EXISTS' ? 'El email ya está en uso' : 'No se pudo crear el usuario')
      throw err
    }
  }

  async function handleEdit(data: UserFormData) {
    if (!editTarget) return
    try {
      const updated = await usersService.update(editTarget.id, {
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      })
      setUsers(prev => prev.map(u => u.id === editTarget.id ? updated : u))
      setEditTarget(null)
      toast.success('Usuario actualizado')
    } catch {
      toast.error('No se pudo actualizar el usuario')
      throw new Error('update failed')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await usersService.remove(deleteTarget.id)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('Usuario eliminado')
    } catch {
      toast.error('No se pudo eliminar el usuario')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Usuarios</h1>
          <p className="text-sm mt-0.5 text-slate-400">Administración de operadores y roles</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 font-semibold bg-violet-600 hover:bg-violet-700">
          <Plus size={15} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, key, iconColor, iconBg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-card">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${iconBg}`}>
              <Icon size={16} className={iconColor} />
            </div>
            <div>
              <p className="font-mono text-[22px] font-bold leading-none text-ink">{statValues[key]}</p>
              <p className="text-[11px] mt-1 text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Nombre', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-12 text-sm text-slate-300">Cargando...</td></tr>
            )}
            {users.map((user, i) => {
              const roleStyle = ROLE_STYLE[user.role as UserRole] ?? ROLE_STYLE.CASHIER
              return (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50 transition-colors ${i > 0 ? 'border-t border-slate-50' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${roleStyle.bg} ${roleStyle.text}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-semibold text-ink">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-500">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                      {ROLE_LABEL[user.role as UserRole] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      user.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="sm" className="gap-1 text-[12px] h-7 px-2.5"
                        onClick={() => { setEditTarget(user); setModalOpen(true) }}
                      >
                        <Pencil size={11} /> Editar
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline" size="sm" className="gap-1 text-[12px] h-7 px-2.5 border-red-300 text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 size={11} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <UserModal
        open={modalOpen}
        user={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onConfirm={editTarget ? handleEdit : handleAdd}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el usuario <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.
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
