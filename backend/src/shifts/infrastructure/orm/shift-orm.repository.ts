import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftOrmEntity, ShiftStatus } from './shift.orm-entity';
import { IShiftRepository } from '../../ports/shift-repository.port';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class ShiftOrmRepository implements IShiftRepository {
  constructor(
    @InjectRepository(ShiftOrmEntity)
    private readonly repo: Repository<ShiftOrmEntity>,
  ) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<ShiftOrmEntity>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      relations: ['cashier'],
      order: { openedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  findOne(id: string): Promise<ShiftOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findActive(): Promise<ShiftOrmEntity | null> {
    return this.repo.findOne({
      where: { status: ShiftStatus.OPEN },
      relations: ['cashier'],
    });
  }

  save(shift: Partial<ShiftOrmEntity>): Promise<ShiftOrmEntity> {
    return this.repo.save(shift as ShiftOrmEntity);
  }

  create(data: Partial<ShiftOrmEntity>): ShiftOrmEntity {
    return this.repo.create(data);
  }
}
