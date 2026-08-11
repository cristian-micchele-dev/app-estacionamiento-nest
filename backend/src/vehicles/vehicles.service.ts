import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleOrmEntity, VehicleType } from './infrastructure/orm/vehicle.orm-entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PaginatedResult, PaginationDto } from '../shared/dto/pagination.dto';
import {
  IVehicleRepository,
  VEHICLE_REPOSITORY,
} from './ports/vehicle-repository.port';

@Injectable()
export class VehiclesService {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly repo: IVehicleRepository,
  ) {}

  findAll(
    pagination: PaginationDto,
    search?: string,
    type?: VehicleType,
  ): Promise<PaginatedResult<VehicleOrmEntity>> {
    return this.repo.findAll(pagination, search, type);
  }

  async findOne(id: string): Promise<VehicleOrmEntity> {
    const vehicle = await this.repo.findOne(id);
    if (!vehicle) throw new NotFoundException('VEHICLE_NOT_FOUND');
    return vehicle;
  }

  findByPlate(plate: string): Promise<VehicleOrmEntity | null> {
    return this.repo.findByPlate(this.normalizePlate(plate));
  }

  async findOrCreateByPlate(
    plate: string,
    type?: VehicleType,
  ): Promise<VehicleOrmEntity> {
    const normalized = this.normalizePlate(plate);

    // Check including soft-deleted to avoid unique constraint violations
    const existing = await this.repo.findByPlateWithDeleted(normalized);

    if (existing) {
      // Restore soft-deleted vehicle if needed
      if (existing.deletedAt) {
        await this.repo.restore(existing.id);
        existing.deletedAt = null;
      }
      return existing;
    }

    return this.repo.save(
      this.repo.create({
        plate: normalized,
        type: type ?? VehicleType.CAR,
      }),
    );
  }

  async create(dto: CreateVehicleDto): Promise<VehicleOrmEntity> {
    const plate = this.normalizePlate(dto.plate);
    const existing = await this.findByPlate(plate);
    if (existing) throw new ConflictException('PLATE_ALREADY_EXISTS');
    return this.repo.save(this.repo.create({ ...dto, plate }));
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleOrmEntity> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.repo.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }

  private normalizePlate(plate: string): string {
    return plate.toUpperCase().replace(/\s+/g, '');
  }
}
