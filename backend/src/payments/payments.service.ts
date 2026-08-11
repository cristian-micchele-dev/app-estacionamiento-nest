import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentMethod,
  PaymentOrmEntity,
} from './infrastructure/orm/payment.orm-entity';
import { IPaymentRepository, PAYMENT_REPOSITORY } from './ports/payment-repository.port';
import { PaginatedResult, PaginationDto } from '../shared/dto/pagination.dto';

export interface CreatePaymentParams {
  ticketId: string;
  shiftId: string | null;
  processedById: string;
  amount: number;
  method: PaymentMethod;
  receivedAmount: number | null;
  changeAmount: number | null;
  paidAt: Date;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  findAll(pagination: PaginationDto): Promise<PaginatedResult<PaymentOrmEntity>> {
    return this.repo.findAll(pagination);
  }

  async findOne(id: string): Promise<PaymentOrmEntity> {
    const payment = await this.repo.findOne(id);
    if (!payment) throw new NotFoundException('PAYMENT_NOT_FOUND');
    return payment;
  }

  findByShift(shiftId: string): Promise<PaymentOrmEntity[]> {
    return this.repo.findByShift(shiftId);
  }

  create(params: CreatePaymentParams): Promise<PaymentOrmEntity> {
    return this.repo.save(this.repo.create(params));
  }
}
