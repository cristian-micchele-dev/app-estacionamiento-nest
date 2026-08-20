import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const TZ = `AT TIME ZONE 'America/Argentina/Buenos_Aires'`;
const TODAY = `DATE(paid_at ${TZ}) = CURRENT_DATE`;
const TODAY_ENTRY = `DATE(entry_time ${TZ}) = CURRENT_DATE`;
const THIS_MONTH = `DATE_TRUNC('month', entry_time ${TZ}) = DATE_TRUNC('month', CURRENT_DATE)`;

export type InsightKey =
  | 'active-sessions'
  | 'today-revenue'
  | 'vehicles-inside'
  | 'last-shift-difference'
  | 'card-payments-today'
  | 'monthly-entries'
  | 'top-tariff'
  | 'top-vehicle'
  | 'active-passes'
  | 'expiring-passes';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async insight(key: InsightKey): Promise<string> {
    this.logger.debug(`Insight requested: ${key}`);
    switch (key) {
      case 'active-sessions':
        return this.activeSessions();
      case 'today-revenue':
        return this.todayRevenue();
      case 'vehicles-inside':
        return this.vehiclesInside();
      case 'last-shift-difference':
        return this.lastShiftDifference();
      case 'card-payments-today':
        return this.cardPaymentsToday();
      case 'monthly-entries':
        return this.monthlyEntries();
      case 'top-tariff':
        return this.topTariff();
      case 'top-vehicle':
        return this.topVehicle();
      case 'active-passes':
        return this.activePasses();
      case 'expiring-passes':
        return this.expiringPasses();
      default:
        throw new BadRequestException('Insight key no reconocida');
    }
  }

  private async activeSessions(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM parking_sessions WHERE status = 'ACTIVE'`,
    );
    return `Hay ${row.total} sesión${row.total !== 1 ? 'es' : ''} activa${row.total !== 1 ? 's' : ''} en este momento.`;
  }

  private async todayRevenue(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total FROM payments WHERE ${TODAY}`,
    );
    const formatted = Number(row.total).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    return `Se recaudaron ${formatted} hoy.`;
  }

  private async vehiclesInside(): Promise<string> {
    const rows = await this.dataSource.query(
      `SELECT v.plate, v.type, ps.entry_time ${TZ} AS entry_time
       FROM parking_sessions ps
       JOIN vehicles v ON v.id = ps.vehicle_id
       WHERE ps.status = 'ACTIVE'
       ORDER BY ps.entry_time DESC
       LIMIT 50`,
    );
    if (!rows.length) return 'No hay vehículos dentro del estacionamiento en este momento.';
    const list = rows
      .map((r: { plate: string; type: string; entry_time: string }) => {
        const since = new Date(r.entry_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        return `• ${r.plate} (${r.type}) — ingresó a las ${since}`;
      })
      .join('\n');
    return `${rows.length} vehículo${rows.length !== 1 ? 's' : ''} dentro:\n${list}`;
  }

  private async lastShiftDifference(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT s.difference::float, s.closing_balance_counted::float, s.closing_balance_system::float,
              s.closed_at ${TZ} AS closed_at, u.name AS cashier
       FROM shifts s
       JOIN users u ON u.id = s.cashier_id
       WHERE s.status = 'CLOSED'
       ORDER BY s.closed_at DESC
       LIMIT 1`,
    );
    if (!row) return 'No hay turnos cerrados aún.';
    const fmt = (n: number) => Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    const diff = Number(row.difference);
    const sign = diff > 0 ? 'sobraron' : diff < 0 ? 'faltaron' : 'no hubo diferencia';
    const date = new Date(row.closed_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    return `Último turno cerrado por ${row.cashier} (${date}):\n• Sistema: ${fmt(row.closing_balance_system)}\n• Contado: ${fmt(row.closing_balance_counted)}\n• Diferencia: ${diff !== 0 ? `${sign} ${fmt(Math.abs(diff))}` : 'exacto'}`;
  }

  private async cardPaymentsToday(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(amount), 0)::float AS amount
       FROM payments
       WHERE method = 'CARD' AND ${TODAY}`,
    );
    const fmt = Number(row.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    return `Hoy se realizaron ${row.total} pago${row.total !== 1 ? 's' : ''} con tarjeta por un total de ${fmt}.`;
  }

  private async monthlyEntries(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM parking_sessions WHERE ${THIS_MONTH}`,
    );
    return `Este mes ingresaron ${row.total} vehículo${row.total !== 1 ? 's' : ''}.`;
  }

  private async topTariff(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT t.name, COUNT(*)::int AS total
       FROM parking_sessions ps
       JOIN tariffs t ON t.id = ps.tariff_id
       GROUP BY t.id, t.name
       ORDER BY total DESC
       LIMIT 1`,
    );
    if (!row) return 'No hay sesiones registradas aún.';
    return `La tarifa más usada es "${row.name}" con ${row.total} sesión${row.total !== 1 ? 'es' : ''}.`;
  }

  private async topVehicle(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT v.plate, v.type, COUNT(*)::int AS total
       FROM parking_sessions ps
       JOIN vehicles v ON v.id = ps.vehicle_id
       GROUP BY v.id, v.plate, v.type
       ORDER BY total DESC
       LIMIT 1`,
    );
    if (!row) return 'No hay sesiones registradas aún.';
    return `El vehículo con más ingresos es ${row.plate} (${row.type}) con ${row.total} visita${row.total !== 1 ? 's' : ''}.`;
  }

  private async activePasses(): Promise<string> {
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM monthly_passes WHERE is_active = true AND valid_to >= CURRENT_DATE`,
    );
    return `Hay ${row.total} abono${row.total !== 1 ? 's' : ''} mensual${row.total !== 1 ? 'es' : ''} activo${row.total !== 1 ? 's' : ''}.`;
  }

  private async expiringPasses(): Promise<string> {
    const rows = await this.dataSource.query(
      `SELECT mp.holder_name, mp.valid_to, v.plate
       FROM monthly_passes mp
       JOIN vehicles v ON v.id = mp.vehicle_id
       WHERE mp.is_active = true
         AND mp.valid_to BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       ORDER BY mp.valid_to ASC`,
    );
    if (!rows.length) return 'Ningún abono vence en los próximos 7 días.';
    const list = rows
      .map((r: { holder_name: string; plate: string; valid_to: string }) => {
        const date = new Date(r.valid_to).toLocaleDateString('es-AR');
        return `• ${r.holder_name} (${r.plate}) — vence el ${date}`;
      })
      .join('\n');
    return `${rows.length} abono${rows.length !== 1 ? 's' : ''} vencen pronto:\n${list}`;
  }
}
