import { UserOrmEntity, UserRole } from '../infrastructure/orm/user.orm-entity';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
}

export interface IUserRepository {
  findAll(
    pagination: PaginationDto,
    filters?: UserFilters,
  ): Promise<[UserOrmEntity[], number]>;
  findOneById(id: string): Promise<UserOrmEntity | null>;
  findOneByEmail(email: string, withDeleted?: boolean): Promise<UserOrmEntity | null>;
  save(user: Partial<UserOrmEntity>): Promise<UserOrmEntity>;
  create(data: Partial<UserOrmEntity>): UserOrmEntity;
  softDelete(id: string): Promise<void>;
  update(id: string, data: Partial<UserOrmEntity>): Promise<void>;
}
