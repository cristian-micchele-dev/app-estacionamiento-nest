import { MonthlyPassOrmEntity } from '../infrastructure/orm/monthly-pass.orm-entity';
import { PaginatedResult, PaginationDto } from '../../shared/dto/pagination.dto';

export const MONTHLY_PASS_REPOSITORY = Symbol('IMonthlyPassRepository');

export interface IMonthlyPassRepository {
  findAll(
    pagination: PaginationDto,
    activeOnly?: boolean,
  ): Promise<PaginatedResult<MonthlyPassOrmEntity>>;
  findOne(id: string): Promise<MonthlyPassOrmEntity | null>;
  findActiveByVehicle(vehicleId: string): Promise<MonthlyPassOrmEntity | null>;
  save(pass: Partial<MonthlyPassOrmEntity>): Promise<MonthlyPassOrmEntity>;
  create(data: Partial<MonthlyPassOrmEntity>): MonthlyPassOrmEntity;
  softDelete(id: string): Promise<void>;
}
