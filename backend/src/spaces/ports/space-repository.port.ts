import { ParkingSpaceOrmEntity } from '../infrastructure/orm/parking-space.orm-entity';

export const SPACE_REPOSITORY = Symbol('ISpaceRepository');

export interface ISpaceRepository {
  findAll(): Promise<ParkingSpaceOrmEntity[]>;
  findOne(id: string): Promise<ParkingSpaceOrmEntity | null>;
  findByCode(code: string): Promise<ParkingSpaceOrmEntity | null>;
  save(space: Partial<ParkingSpaceOrmEntity>): Promise<ParkingSpaceOrmEntity>;
  create(data: Partial<ParkingSpaceOrmEntity>): ParkingSpaceOrmEntity;
  update(id: string, data: Partial<ParkingSpaceOrmEntity>): Promise<void>;
  delete(id: string): Promise<void>;
}
