import type { TicketApi } from '@/services/tickets.service'

export interface ReportPeriod {
  dateFrom: string
  dateTo: string
}

interface ReportSummary {
  totalTickets: number
  paid: number
  pending: number
  cancelled: number
  totalCollected: number
  totalQuoted: number
  avgTicket: number
}

const STATUS_LABEL: Record<string, string> = {
  PAID:      'Pagado',
  PENDING:   'Pendiente',
  CANCELLED: 'Cancelado',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtMoney(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildSummary(tickets: TicketApi[]): ReportSummary {
  const paid      = tickets.filter(t => t.status === 'PAID')
  const pending   = tickets.filter(t => t.status === 'PENDING')
  const cancelled = tickets.filter(t => t.status === 'CANCELLED')

  const totalCollected = paid.reduce((s, t) => s + Number(t.totalAmount), 0)
  const totalQuoted    = tickets.reduce((s, t) => s + Number(t.totalAmount), 0)

  return {
    totalTickets:   tickets.length,
    paid:           paid.length,
    pending:        pending.length,
    cancelled:      cancelled.length,
    totalCollected,
    totalQuoted,
    avgTicket: paid.length > 0 ? totalCollected / paid.length : 0,
  }
}

function buildDailySummary(tickets: TicketApi[]): { date: string; count: number; paid: number; collected: number }[] {
  const map = new Map<string, { date: string; count: number; paid: number; collected: number }>()
  tickets.forEach(t => {
    const date = t.createdAt.slice(0, 10)
    const row  = map.get(date) ?? { date, count: 0, paid: 0, collected: 0 }
    row.count++
    if (t.status === 'PAID') { row.paid++; row.collected += Number(t.totalAmount) }
    map.set(date, row)
  })
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date))
}

function generateHTML(tickets: TicketApi[], period: ReportPeriod): string {
  const s = buildSummary(tickets)
  const daily = buildDailySummary(tickets)
  const generatedAt = new Date().toLocaleString('es-AR')

  const dailyRows = daily.map(r => `
    <tr>
      <td>${fmtDate(r.date)}</td>
      <td>${r.count}</td>
      <td>${r.paid}</td>
      <td class="bold" style="color:#16A34A">$${fmtMoney(r.collected)}</td>
    </tr>`).join('')

  const ticketRows = tickets.map(t => `
    <tr>
      <td>${t.session?.ticketNumber ?? '—'}</td>
      <td>${t.session?.vehicle?.plate ?? '—'}</td>
      <td>${fmtDate(t.createdAt)}</td>
      <td>${t.durationMinutes} min</td>
      <td>$${fmtMoney(Number(t.subtotal))}</td>
      <td>${Number(t.discountAmount) > 0 ? `-$${fmtMoney(Number(t.discountAmount))}` : '—'}</td>
      <td class="bold">$${fmtMoney(Number(t.totalAmount))}</td>
      <td><span class="badge badge-${t.status.toLowerCase()}">${STATUS_LABEL[t.status] ?? t.status}</span></td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte ParkAdmin</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { margin:15mm; size:A4 landscape; }
    body { font-family:Arial,sans-serif; font-size:11px; color:#111; background:#fff; }

    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:10px; border-bottom:2px solid #1E3A5F; }
    .brand  { font-size:20px; font-weight:bold; color:#1E3A5F; letter-spacing:1px; }
    .meta   { text-align:right; font-size:10px; color:#555; }
    .period { font-size:12px; font-weight:bold; color:#374151; }

    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
    .stat    { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:10px 12px; }
    .stat-val { font-size:18px; font-weight:bold; color:#0F1723; font-family:'Courier New',monospace; }
    .stat-lbl { font-size:9px; color:#64748B; text-transform:uppercase; letter-spacing:.5px; margin-top:2px; }

    .section-title { font-size:11px; font-weight:bold; color:#374151; text-transform:uppercase; letter-spacing:.5px; margin:14px 0 6px; }

    table { width:100%; border-collapse:collapse; font-size:10px; }
    thead tr { background:#1E3A5F; color:#fff; }
    th { padding:6px 8px; text-align:left; font-weight:600; font-size:9px; text-transform:uppercase; letter-spacing:.5px; }
    td { padding:5px 8px; border-bottom:1px solid #F1F5F9; }
    tr:nth-child(even) td { background:#FAFAFA; }
    .bold { font-weight:bold; }

    .badge { display:inline-block; padding:1px 6px; border-radius:10px; font-size:9px; font-weight:bold; }
    .badge-paid      { background:#F0FDF4; color:#16A34A; }
    .badge-pending   { background:#FFFBEB; color:#D97706; }
    .badge-cancelled { background:#FEF2F2; color:#DC2626; }

    .footer { margin-top:16px; font-size:9px; color:#94A3B8; text-align:center; border-top:1px solid #E2E8F0; padding-top:8px; }

    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand">PARKADMIN</div>
      <div style="font-size:10px;color:#64748B;margin-top:2px;">Sistema de Estacionamiento — Reporte</div>
    </div>
    <div class="meta">
      <div class="period">Período: ${fmtDate(period.dateFrom)} al ${fmtDate(period.dateTo)}</div>
      <div style="margin-top:3px;">Generado: ${generatedAt}</div>
    </div>
  </div>

  <!-- Summary cards -->
  <div class="summary">
    <div class="stat">
      <div class="stat-val">${s.totalTickets}</div>
      <div class="stat-lbl">Total tickets</div>
    </div>
    <div class="stat">
      <div class="stat-val">$${fmtMoney(s.totalCollected)}</div>
      <div class="stat-lbl">Total recaudado</div>
    </div>
    <div class="stat">
      <div class="stat-val">$${fmtMoney(s.avgTicket)}</div>
      <div class="stat-lbl">Promedio por ticket</div>
    </div>
    <div class="stat">
      <div class="stat-val">${s.paid} / ${s.pending} / ${s.cancelled}</div>
      <div class="stat-lbl">Pagados / Pendientes / Cancelados</div>
    </div>
  </div>

  <!-- Daily summary (only when period spans multiple days) -->
  ${daily.length > 1 ? `
  <div class="section-title">Resumen por día</div>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Tickets</th>
        <th>Pagados</th>
        <th>Recaudado</th>
      </tr>
    </thead>
    <tbody>${dailyRows}</tbody>
  </table>` : ''}

  <!-- Ticket detail table -->
  <div class="section-title">Detalle de tickets</div>
  <table>
    <thead>
      <tr>
        <th>N° Ticket</th>
        <th>Patente</th>
        <th>Fecha</th>
        <th>Duración</th>
        <th>Subtotal</th>
        <th>Descuento</th>
        <th>Total</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${ticketRows || '<tr><td colspan="8" style="text-align:center;padding:12px;color:#94A3B8;">Sin datos para el período seleccionado</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    ParkAdmin · Reporte generado automáticamente · ${generatedAt}
  </div>

</body>
</html>`
}

export function printReport(tickets: TicketApi[], period: ReportPeriod): void {
  const w = window.open('', '_blank', 'width=1100,height=750,scrollbars=yes')
  if (!w) {
    console.warn('printReport: popup bloqueado')
    return
  }
  w.document.write(generateHTML(tickets, period))
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
    w.addEventListener('afterprint', () => w.close())
  }, 300)
}
