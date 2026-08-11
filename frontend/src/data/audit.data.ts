export type AuditAction =
  | 'VEHICLE_ENTRY'
  | 'VEHICLE_EXIT'
  | 'PAYMENT_PROCESSED'
  | 'SHIFT_OPENED'
  | 'SHIFT_CLOSED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'TARIFF_CREATED'
  | 'TARIFF_UPDATED'
  | 'MONTHLY_PASS_CREATED'
  | 'LOGIN'
  | 'LOGOUT'

export const ACTION_LABEL: Record<AuditAction, string> = {
  VEHICLE_ENTRY:        'Entrada de vehículo',
  VEHICLE_EXIT:         'Salida de vehículo',
  PAYMENT_PROCESSED:    'Pago procesado',
  SHIFT_OPENED:         'Turno abierto',
  SHIFT_CLOSED:         'Turno cerrado',
  USER_CREATED:         'Usuario creado',
  USER_UPDATED:         'Usuario actualizado',
  TARIFF_CREATED:       'Tarifa creada',
  TARIFF_UPDATED:       'Tarifa actualizada',
  MONTHLY_PASS_CREATED: 'Abono creado',
  LOGIN:                'Inicio de sesión',
  LOGOUT:               'Cierre de sesión',
}

export const ACTION_COLOR: Record<AuditAction, { text: string; bg: string }> = {
  VEHICLE_ENTRY:        { text: 'text-green-600',  bg: 'bg-green-50'  },
  VEHICLE_EXIT:         { text: 'text-orange-600', bg: 'bg-orange-50' },
  PAYMENT_PROCESSED:    { text: 'text-blue-600',   bg: 'bg-blue-50'   },
  SHIFT_OPENED:         { text: 'text-green-600',  bg: 'bg-green-50'  },
  SHIFT_CLOSED:         { text: 'text-red-600',    bg: 'bg-red-50'    },
  USER_CREATED:         { text: 'text-violet-600', bg: 'bg-violet-50' },
  USER_UPDATED:         { text: 'text-violet-600', bg: 'bg-violet-50' },
  TARIFF_CREATED:       { text: 'text-signal-dark',  bg: 'bg-signal/10'  },
  TARIFF_UPDATED:       { text: 'text-signal-dark',  bg: 'bg-signal/10'  },
  MONTHLY_PASS_CREATED: { text: 'text-cyan-600',   bg: 'bg-cyan-50'   },
  LOGIN:                { text: 'text-slate-500',  bg: 'bg-slate-100' },
  LOGOUT:               { text: 'text-slate-500',  bg: 'bg-slate-100' },
}
