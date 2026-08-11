import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from './parking-session.orm-entity';
import {
  ISessionRepository,
  SessionStats,
} from '../../ports/session-repository.port';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class SessionOrmRepository implements ISessionRepository {
  constructor(
    @InjectRepository(ParkingSessionOrmEntity)
    private readonly repo: Repository<ParkingSessionOrmEntity>,
  ) {}

  async findAll(
    pagination: PaginationDto,
    status?: SessionStatus,
  ): Promise<PaginatedResult<ParkingSessionOrmEntity>> {
    const { page, limit } = pagination;

    const qb = this.repo
      .createQueryBuilder('s')
      .withDeleted()                              // incluye tarifas soft-deleted en los joins
      .leftJoinAndSelect('s.vehicle', 'vehicle')
      .leftJoinAndSelect('s.tariff', 'tariff')
      .leftJoinAndSelect('s.entryBy', 'entryBy')
      .leftJoinAndSelect('s.space', 'space')
      .orderBy('s.entryTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('s.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  findOne(id: string): Promise<ParkingSessionOrmEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['vehicle', 'tariff', 'entryBy', 'exitBy', 'space'],
    });
  }

  findByTicketNumber(ticketNumber: string): Promise<ParkingSessionOrmEntity | null> {
    return this.repo.findOne({
      where: { ticketNumber },
      relations: ['vehicle', 'tariff', 'entryBy', 'exitBy', 'space'],
    });
  }

  findActiveByVehicle(vehicleId: string): Promise<ParkingSessionOrmEntity | null> {
    return this.repo.findOne({
      where: { vehicleId, status: SessionStatus.ACTIVE },
    });
  }

  save(entity: ParkingSessionOrmEntity): Promise<ParkingSessionOrmEntity> {
    return this.repo.save(entity);
  }

  create(data: Partial<ParkingSessionOrmEntity>): ParkingSessionOrmEntity {
    return this.repo.create(data);
  }

  async getStats(): Promise<SessionStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const [row] = await this.repo.query(
      `SELECT
        (SELECT COUNT(*)::int FROM parking_sessions WHERE status = 'ACTIVE') AS "activeCount",
        COUNT(ps.id)::int                                                     AS "completedToday",
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (ps.exit_time - ps.entry_time)) / 60)), 0)::int AS "avgDurationMinutes",
        COALESCE(SUM(t.total_amount), 0)::float                               AS "revenueToday"
       FROM parking_sessions ps
       LEFT JOIN tickets t ON t.session_id = ps.id AND t.status = 'PAID'
       WHERE ps.status = 'COMPLETED'
         AND ps.exit_time >= $1
         AND ps.exit_time <  $2`,
      [todayStart, tomorrowStart],
    );

    return {
      activeCount:        Number(row.activeCount),
      completedToday:     Number(row.completedToday),
      avgDurationMinutes: Number(row.avgDurationMinutes),
      revenueToday:       Number(row.revenueToday),
    };
  }

  async nextTicketNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [{ nextval }] = await this.repo.query(
      `SELECT nextval('ticket_number_seq') AS nextval`,
    );
    return `TK-${dateStr}-${String(Number(nextval)).padStart(4, '0')}`;
  }
}
