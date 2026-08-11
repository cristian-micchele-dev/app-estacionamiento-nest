export interface PrintTicketData {
  ticketNumber: string
  plate: string
  vehicleType: string
  tariffName: string
  entryTime: Date | string
  exitTime: Date | string
  durationMinutes: number
  subtotal: number
  discountAmount: number
  totalAmount: number
  paymentMethod?: string
  cashierName: string
  reprint?: boolean
}

const PAYMENT_LABEL: Record<string, string> = {
  CASH:         'Efectivo',
  CARD:         'Tarjeta',
  TRANSFER:     'Transferencia',
  MONTHLY_PASS: 'Abono Mensual',
}

const VEHICLE_LABEL: Record<string, string> = {
  CAR:        'Automóvil',
  MOTORCYCLE: 'Motocicleta',
  TRUCK:      'Camión',
  VAN:        'Camioneta',
  BUS:        'Colectivo',
}

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d
}

function fmtTime(d: Date | string): string {
  return toDate(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: Date | string): string {
  return toDate(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function fmtMoney(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function row(label: string, value: string, bold = false): string {
  return `
    <div style="display:flex;justify-content:space-between;margin:2px 0;">
      <span style="color:#444;">${label}</span>
      <span style="${bold ? 'font-weight:bold;' : ''}">${value}</span>
    </div>`
}

function divider(): string {
  return `<div style="border-top:1px dashed #000;margin:6px 0;"></div>`
}

function generateHTML(d: PrintTicketData): string {
  const exitDate = toDate(d.exitTime)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket ${d.ticketNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { margin:4mm; size:80mm auto; }
    body {
      font-family:'Courier New',Courier,monospace;
      font-size:12px;
      color:#000;
      background:#fff;
      width:72mm;
      padding:4mm;
    }
    @media print { body { width:72mm; } }
  </style>
</head>
<body>

  <!-- Encabezado -->
  <div style="text-align:center;">
    ${d.reprint ? `<div style="font-size:10px;letter-spacing:1px;color:#555;margin-bottom:2px;">— REIMPRESIÓN —</div>` : ''}
    <div style="font-size:18px;font-weight:bold;letter-spacing:2px;">PARKADMIN</div>
    <div style="font-size:10px;color:#555;">Sistema de Estacionamiento</div>
  </div>

  ${divider()}

  ${row('TICKET N°', d.ticketNumber, true)}
  ${row('FECHA', fmtDate(exitDate))}

  ${divider()}

  <!-- Patente destacada -->
  <div style="text-align:center;font-size:22px;font-weight:bold;letter-spacing:3px;margin:4px 0;">
    ${d.plate}
  </div>
  ${row('TIPO', VEHICLE_LABEL[d.vehicleType] ?? d.vehicleType)}
  ${row('TARIFA', d.tariffName)}

  ${divider()}

  ${row('INGRESO', fmtTime(d.entryTime))}
  ${row('EGRESO', fmtTime(d.exitTime))}
  ${row('DURACIÓN', fmtDuration(d.durationMinutes), true)}

  ${divider()}

  ${row('Subtotal', `$${fmtMoney(d.subtotal)}`)}
  ${d.discountAmount > 0 ? row('Descuento', `-$${fmtMoney(d.discountAmount)}`) : ''}
  <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:15px;font-weight:bold;">
    <span>TOTAL</span>
    <span>$${fmtMoney(d.totalAmount)}</span>
  </div>

  ${divider()}

  ${row('PAGO', d.paymentMethod ? (PAYMENT_LABEL[d.paymentMethod] ?? d.paymentMethod) : '—', true)}
  ${row('CAJERO', d.cashierName)}

  ${divider()}

  <div style="text-align:center;margin-top:6px;">
    <div style="font-size:13px;font-weight:bold;">¡Gracias por su visita!</div>
    <div style="font-size:10px;color:#777;margin-top:3px;">Conserve este comprobante</div>
  </div>

</body>
</html>`
}

export interface PrintEntryTicketData {
  ticketNumber: string
  plate: string
  vehicleType: string
  tariffName: string
  entryTime: Date | string
  spaceCode?: string
  cashierName: string
}

function generateEntryHTML(d: PrintEntryTicketData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Entrada ${d.ticketNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { margin:4mm; size:80mm auto; }
    body {
      font-family:'Courier New',Courier,monospace;
      font-size:12px;
      color:#000;
      background:#fff;
      width:72mm;
      padding:4mm;
    }
    @media print { body { width:72mm; } }
  </style>
</head>
<body>

  <div style="text-align:center;">
    <div style="font-size:18px;font-weight:bold;letter-spacing:2px;">PARKADMIN</div>
    <div style="font-size:10px;color:#555;">Comprobante de Ingreso</div>
  </div>

  ${divider()}

  ${row('TICKET N°', d.ticketNumber, true)}
  ${row('FECHA', fmtDate(d.entryTime))}
  ${row('HORA INGRESO', fmtTime(d.entryTime), true)}

  ${divider()}

  <div style="text-align:center;font-size:22px;font-weight:bold;letter-spacing:3px;margin:6px 0;">
    ${d.plate}
  </div>
  ${row('TIPO', VEHICLE_LABEL[d.vehicleType] ?? d.vehicleType)}
  ${row('TARIFA', d.tariffName)}
  ${d.spaceCode ? row('ESPACIO', d.spaceCode) : ''}

  ${divider()}

  ${row('CAJERO', d.cashierName)}

  ${divider()}

  <div style="text-align:center;margin-top:6px;">
    <div style="font-size:11px;font-weight:bold;">Conserve este ticket</div>
    <div style="font-size:10px;color:#777;margin-top:2px;">Lo necesitará al retirar su vehículo</div>
  </div>

</body>
</html>`
}

export function printEntryTicket(data: PrintEntryTicketData): void {
  const w = window.open('', '_blank', 'width=400,height=520,scrollbars=yes')
  if (!w) {
    console.warn('printEntryTicket: popup bloqueado por el navegador')
    return
  }
  w.document.write(generateEntryHTML(data))
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
    w.addEventListener('afterprint', () => w.close())
  }, 250)
}

export function printTicket(data: PrintTicketData): void {
  const w = window.open('', '_blank', 'width=400,height=680,scrollbars=yes')
  if (!w) {
    console.warn('printTicket: popup bloqueado por el navegador')
    return
  }
  w.document.write(generateHTML(data))
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
    w.addEventListener('afterprint', () => w.close())
  }, 250)
}
