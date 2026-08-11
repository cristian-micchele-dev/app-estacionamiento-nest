import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyPassOrmEntity } from './monthly-pass.orm-entity';
import { IMonthlyPassRepository } from '../../ports/monthly-pass-repository.port';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class MonthlyPassOrmRepository implements IMonthlyPassRepository {
  constructor(
    @InjectRepository(MonthlyPassOrmEntity)
    private readonly repo: Repository<MonthlyPassOrmEntity>,
  ) {}

  async findAll(
    pagination: PaginationDto,
    activeOnly?: boolean,
  ): Promise<PaginatedResult<MonthlyPassOrmEntity>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      where: activeOnly ? { isActive: true } : undefined,
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  findOne(id: string): Promise<MonthlyPassOrmEntity | null> {
    return this.repo.findOne({ where: { id }, relations: ['vehicle'] });
  }

  findActiveByVehicle(vehicleId: string): Promise<MonthlyPassOrmEntity | null> {
    const today = new Date().toISOString().slice(0, 10);
    return this.repo
      .createQueryBuilder('mp')
      .where('mp.vehicleId = :vehicleId', { vehicleId })
      .andWhere('mp.isActive = true')
      .andWhere('mp.validFrom <= :today', { today })
      .andWhere('mp.validTo >= :today', { today })
      .andWhere('mp.deleted_at IS NULL')
      .getOne();
  }

  save(pass: Partial<MonthlyPassOrmEntity>): Promise<MonthlyPassOrmEntity> {
    return this.repo.save(pass as MonthlyPassOrmEntity);
  }

  create(data: Partial<MonthlyPassOrmEntity>): MonthlyPassOrmEntity {
    return this.repo.create(data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
