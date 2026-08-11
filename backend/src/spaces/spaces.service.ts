import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ParkingSpaceOrmEntity,
  SpaceStatus,
  SpaceType,
} from './infrastructure/orm/parking-space.orm-entity';
import { ISpaceRepository, SPACE_REPOSITORY } from './ports/space-repository.port';
import { VehicleType } from '../vehicles/infrastructure/orm/vehicle.orm-entity';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

const COMPATIBLE_VEHICLE_TYPES: Record<SpaceType, VehicleType[]> = {
  [SpaceType.MOTORCYCLE]: [VehicleType.MOTORCYCLE],
  [SpaceType.CAR]:        [VehicleType.CAR, VehicleType.VAN, VehicleType.TRUCK, VehicleType.BUS],
  [SpaceType.DISABLED]:   [VehicleType.CAR, VehicleType.VAN],
};

@Injectable()
export class SpacesService {
  constructor(
    @Inject(SPACE_REPOSITORY)
    private readonly repo: ISpaceRepository,
  ) {}

  findAll(): Promise<ParkingSpaceOrmEntity[]> {
    return this.repo.findAll();
  }

  async findOne(id: string): Promise<ParkingSpaceOrmEntity> {
    const space = await this.repo.findOne(id);
    if (!space) throw new NotFoundException('SPACE_NOT_FOUND');
    return space;
  }

  async findByCode(code: string): Promise<ParkingSpaceOrmEntity> {
    const space = await this.repo.findByCode(code);
    if (!space) throw new NotFoundException('SPACE_NOT_FOUND');
    return space;
  }

  async create(dto: CreateSpaceDto): Promise<ParkingSpaceOrmEntity> {
    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw new ConflictException('SPACE_CODE_ALREADY_EXISTS');

    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateSpaceDto): Promise<ParkingSpaceOrmEntity> {
    const space = await this.findOne(id);

    if (
      dto.status === SpaceStatus.AVAILABLE &&
      space.status === SpaceStatus.OCCUPIED
    ) {
      throw new BadRequestException('CANNOT_FREE_OCCUPIED_SPACE_MANUALLY');
    }

    Object.assign(space, dto);
    return this.repo.save(space);
  }

  async markOccupied(id: string): Promise<void> {
    await this.repo.update(id, { status: SpaceStatus.OCCUPIED });
  }

  async markAvailable(id: string): Promise<void> {
    await this.repo.update(id, { status: SpaceStatus.AVAILABLE });
  }

  async remove(id: string): Promise<void> {
    const space = await this.findOne(id);
    if (space.status === SpaceStatus.OCCUPIED) {
      throw new BadRequestException('CANNOT_DELETE_OCCUPIED_SPACE');
    }
    await this.repo.delete(id);
  }

  assertCompatible(space: ParkingSpaceOrmEntity, vehicleType: VehicleType): void {
    const allowed = COMPATIBLE_VEHICLE_TYPES[space.type];
    if (!allowed.includes(vehicleType)) {
      throw new BadRequestException('SPACE_TYPE_INCOMPATIBLE');
    }
  }
}
