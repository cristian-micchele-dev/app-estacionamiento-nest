import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { IUserRepository, UserFilters } from '../../ports/user-repository.port';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

@Injectable()
export class UserOrmRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  findAll(
    pagination: PaginationDto,
    filters?: UserFilters,
  ): Promise<[UserOrmEntity[], number]> {
    const { page, limit } = pagination;
    const where: Partial<UserOrmEntity> = {};
    if (filters?.role !== undefined) where.role = filters.role;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    return this.repo.findAndCount({ where, skip: (page - 1) * limit, take: limit });
  }

  findOneById(id: string): Promise<UserOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findOneByEmail(email: string, withDeleted = false): Promise<UserOrmEntity | null> {
    return this.repo.findOne({ where: { email }, withDeleted });
  }

  save(user: Partial<UserOrmEntity>): Promise<UserOrmEntity> {
    return this.repo.save(user as UserOrmEntity);
  }

  create(data: Partial<UserOrmEntity>): UserOrmEntity {
    return this.repo.create(data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async update(id: string, data: Partial<UserOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }
}
