import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingSpaceOrmEntity } from './parking-space.orm-entity';
import { ISpaceRepository } from '../../ports/space-repository.port';

@Injectable()
export class SpaceOrmRepository implements ISpaceRepository {
  constructor(
    @InjectRepository(ParkingSpaceOrmEntity)
    private readonly repo: Repository<ParkingSpaceOrmEntity>,
  ) {}

  findAll(): Promise<ParkingSpaceOrmEntity[]> {
    return this.repo.find({ order: { code: 'ASC' } });
  }

  findOne(id: string): Promise<ParkingSpaceOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<ParkingSpaceOrmEntity | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase() } });
  }

  save(space: Partial<ParkingSpaceOrmEntity>): Promise<ParkingSpaceOrmEntity> {
    return this.repo.save(space as ParkingSpaceOrmEntity);
  }

  create(data: Partial<ParkingSpaceOrmEntity>): ParkingSpaceOrmEntity {
    return this.repo.create(data);
  }

  async update(id: string, data: Partial<ParkingSpaceOrmEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
