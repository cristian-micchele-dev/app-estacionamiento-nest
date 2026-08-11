import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { IVehicleRepository } from '../../ports/vehicle-repository.port';
import { VehicleOrmEntity, VehicleType } from './vehicle.orm-entity';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../../../shared/dto/pagination.dto';

@Injectable()
export class VehicleOrmRepository implements IVehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repo: Repository<VehicleOrmEntity>,
  ) {}

  async findAll(
    pagination: PaginationDto,
    search?: string,
    type?: VehicleType,
  ): Promise<PaginatedResult<VehicleOrmEntity>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      where: search
        ? [{ plate: ILike(`%${search}%`) }, { brand: ILike(`%${search}%`) }]
        : type
          ? { type }
          : undefined,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  findOne(id: string): Promise<VehicleOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByPlate(plate: string): Promise<VehicleOrmEntity | null> {
    return this.repo.findOne({ where: { plate } });
  }

  findByPlateWithDeleted(plate: string): Promise<VehicleOrmEntity | null> {
    return this.repo.findOne({ where: { plate }, withDeleted: true });
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  save(data: Partial<VehicleOrmEntity>): Promise<VehicleOrmEntity> {
    return this.repo.save(data as VehicleOrmEntity);
  }

  create(data: Partial<VehicleOrmEntity>): VehicleOrmEntity {
    return this.repo.create(data);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
