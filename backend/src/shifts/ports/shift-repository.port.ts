import { ShiftOrmEntity } from '../infrastructure/orm/shift.orm-entity';
import { PaginatedResult, PaginationDto } from '../../shared/dto/pagination.dto';

export const SHIFT_REPOSITORY = Symbol('IShiftRepository');

export interface IShiftRepository {
  findAll(pagination: PaginationDto): Promise<PaginatedResult<ShiftOrmEntity>>;
  findOne(id: string): Promise<ShiftOrmEntity | null>;
  findActive(): Promise<ShiftOrmEntity | null>;
  save(shift: Partial<ShiftOrmEntity>): Promise<ShiftOrmEntity>;
  create(data: Partial<ShiftOrmEntity>): ShiftOrmEntity;
}
