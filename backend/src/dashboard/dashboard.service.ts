import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from '../parking/infrastructure/orm/parking-session.orm-entity';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

export interface SeriesPoint {
  date: string;
  sessions: number;
  quoted: number;
  collected: number;
}

export interface DashboardStats {
  activeSessions: number;
  totalSessions: number;
  totalQuoted: number;
  totalCollected: number;
  avgTicket: number;
  collectionRate: number;
  series: SeriesPoint[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ParkingSessionOrmEntity)
    private readonly sessionsRepo: Repository<ParkingSessionOrmEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async getStats(query: DashboardQueryDto): Promise<DashboardStats> {
    const cacheKey = `dashboard:${query.period}:${query.date ?? 'today'}`;
    const cached = await this.cache.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    const ref = query.date ? new Date(query.date) : new Date();
    const { from, to, truncUnit } = this.buildRange(query.period, ref);

    const [series, activeSessions] = await Promise.all([
      this.querySeries(from, to, truncUnit),
      this.sessionsRepo.count({ where: { status: SessionStatus.ACTIVE } }),
    ]);

    const totalSessions = series.reduce((s, p) => s + p.sessions, 0);
    const totalQuoted = series.reduce((s, p) => s + p.quoted, 0);
    const totalCollected = series.reduce((s, p) => s + p.collected, 0);

    const result: DashboardStats = {
      activeSessions,
      totalSessions,
      totalQuoted: round2(totalQuoted),
      totalCollected: round2(totalCollected),
      avgTicket: round2(totalSessions > 0 ? totalQuoted / totalSessions : 0),
      collectionRate: round2(
        totalQuoted > 0 ? (totalCollected / totalQuoted) * 100 : 0,
      ),
      series,
    };

    await this.cache.set(cacheKey, result);
    return result;
  }

  private buildRange(
    period: 'day' | 'week' | 'month',
    ref: Date,
  ): { from: Date; to: Date; truncUnit: string } {
    const to = new Date(ref);
    to.setHours(23, 59, 59, 999);

    const from = new Date(ref);

    if (period === 'day') {
      from.setDate(from.getDate() - 29); // últimos 30 días
      from.setHours(0, 0, 0, 0);
      return { from, to, truncUnit: 'day' };
    }

    if (period === 'week') {
      from.setDate(from.getDate() - 7 * 11); // últimas 12 semanas
      from.setHours(0, 0, 0, 0);
      return { from, to, truncUnit: 'week' };
    }

    // month — últimos 12 meses
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    return { from, to, truncUnit: 'month' };
  }

  private async querySeries(
    from: Date,
    to: Date,
    truncUnit: string,
  ): Promise<SeriesPoint[]> {
    const rows: Array<{
      date: string;
      sessions: string;
      quoted: string;
      collected: string;
    }> = await this.sessionsRepo.query(
      `
      SELECT
        date_trunc($1, ps.entry_time)    AS date,
        COUNT(ps.id)                     AS sessions,
        COALESCE(SUM(t.total_amount), 0) AS quoted,
        COALESCE(SUM(p.collected), 0)    AS collected
      FROM parking_sessions ps
      LEFT JOIN tickets t ON t.session_id = ps.id
      LEFT JOIN (
        SELECT ticket_id, SUM(amount) AS collected
        FROM payments
        GROUP BY ticket_id
      ) p ON p.ticket_id = t.id
      WHERE ps.entry_time >= $2
        AND ps.entry_time <  $3
        AND ps.status = 'COMPLETED'
      GROUP BY 1
      ORDER BY 1
      `,
      [truncUnit, from, to],
    );

    return rows.map((r) => ({
      date: new Date(r.date).toISOString(),
      sessions: Number(r.sessions),
      quoted: round2(Number(r.quoted)),
      collected: round2(Number(r.collected)),
    }));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
