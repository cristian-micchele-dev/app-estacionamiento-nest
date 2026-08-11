import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketOrmEntity } from './ticket.orm-entity';
import { ITicketRepository, TicketFilters } from '../../ports/ticket-repository.port';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class TicketOrmRepository implements ITicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repo: Repository<TicketOrmEntity>,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: TicketFilters,
  ): Promise<PaginatedResult<TicketOrmEntity>> {
    const { page, limit } = pagination;
    const { search, status, dateFrom, dateTo, all } = filters ?? {};

    const qb = this.repo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.session', 'session')
      .leftJoinAndSelect('session.vehicle', 'vehicle')
      .orderBy('t.createdAt', 'DESC');

    if (search) {
      qb.andWhere(
        '(session.ticketNumber ILIKE :search OR vehicle.plate ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('t.status = :status', { status });
    }

    if (dateFrom) {
      const start = new Date(`${dateFrom}T00:00:00`);
      qb.andWhere('t.createdAt >= :dateFrom', { dateFrom: start });
    }

    if (dateTo) {
      const end = new Date(`${dateTo}T23:59:59.999`);
      qb.andWhere('t.createdAt <= :dateTo', { dateTo: end });
    }

    if (!all) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, all ? 1 : limit);
  }

  findOne(id: string): Promise<TicketOrmEntity | null> {
    return this.repo.findOne({ where: { id }, relations: ['session'] });
  }

  findBySession(sessionId: string): Promise<TicketOrmEntity | null> {
    return this.repo.findOne({ where: { sessionId } });
  }

  save(ticket: Partial<TicketOrmEntity>): Promise<TicketOrmEntity> {
    return this.repo.save(ticket as TicketOrmEntity);
  }
}
