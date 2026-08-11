import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrmEntity } from './payment.orm-entity';
import { IPaymentRepository } from '../../ports/payment-repository.port';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class PaymentOrmRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly repo: Repository<PaymentOrmEntity>,
  ) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<PaymentOrmEntity>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      relations: ['ticket', 'processedBy', 'shift'],
      order: { paidAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  findOne(id: string): Promise<PaymentOrmEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['ticket', 'processedBy', 'shift'],
    });
  }

  findByShift(shiftId: string): Promise<PaymentOrmEntity[]> {
    return this.repo.find({ where: { shiftId } });
  }

  save(data: Partial<PaymentOrmEntity>): Promise<PaymentOrmEntity> {
    return this.repo.save(data as PaymentOrmEntity);
  }

  create(data: Partial<PaymentOrmEntity>): PaymentOrmEntity {
    return this.repo.create(data);
  }
}
