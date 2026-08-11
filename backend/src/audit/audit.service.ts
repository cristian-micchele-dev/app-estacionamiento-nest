import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditAction,
  AuditLogOrmEntity,
} from './infrastructure/orm/audit-log.orm-entity';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../shared/dto/pagination.dto';

interface LogParams {
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  log(params: LogParams): Promise<AuditLogOrmEntity> {
    return this.repo.save(this.repo.create(params));
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<AuditLogOrmEntity>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }
}
