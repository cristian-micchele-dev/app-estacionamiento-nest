import {
  PaginatedResult,
  PaginationDto,
} from '../../shared/dto/pagination.dto';
import {
  VehicleOrmEntity,
  VehicleType,
} from '../infrastructure/orm/vehicle.orm-entity';

export const VEHICLE_REPOSITORY = Symbol('IVehicleRepository');

export interface IVehicleRepository {
  findAll(
    pagination: PaginationDto,
    search?: string,
    type?: VehicleType,
  ): Promise<PaginatedResult<VehicleOrmEntity>>;

  findOne(id: string): Promise<VehicleOrmEntity | null>;

  /** Busca por patente normalizada, excluye soft-deleted. */
  findByPlate(plate: string): Promise<VehicleOrmEntity | null>;

  /** Busca por patente normalizada, incluye soft-deleted (para findOrCreate). */
  findByPlateWithDeleted(plate: string): Promise<VehicleOrmEntity | null>;

  restore(id: string): Promise<void>;

  save(data: Partial<VehicleOrmEntity>): Promise<VehicleOrmEntity>;

  create(data: Partial<VehicleOrmEntity>): VehicleOrmEntity;

  softDelete(id: string): Promise<void>;
}
