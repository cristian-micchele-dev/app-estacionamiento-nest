import { PaymentOrmEntity } from '../infrastructure/orm/payment.orm-entity';
import { PaginatedResult, PaginationDto } from '../../shared/dto/pagination.dto';

export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');

export interface IPaymentRepository {
  findAll(pagination: PaginationDto): Promise<PaginatedResult<PaymentOrmEntity>>;
  findOne(id: string): Promise<PaymentOrmEntity | null>;
  findByShift(shiftId: string): Promise<PaymentOrmEntity[]>;
  save(data: Partial<PaymentOrmEntity>): Promise<PaymentOrmEntity>;
  create(data: Partial<PaymentOrmEntity>): PaymentOrmEntity;
}
