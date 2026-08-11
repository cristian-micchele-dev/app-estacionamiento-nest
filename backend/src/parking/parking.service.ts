import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from './infrastructure/orm/parking-session.orm-entity';
import {
  ParkingSpaceOrmEntity,
  SpaceStatus,
} from '../spaces/infrastructure/orm/parking-space.orm-entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { MonthlyPassesService } from '../monthly-passes/monthly-passes.service';
import { SpacesService } from '../spaces/spaces.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/infrastructure/orm/audit-log.orm-entity';
import { ParkingEventsService } from './parking-events.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PaginatedResult, PaginationDto } from '../shared/dto/pagination.dto';
import {
  ISessionRepository,
  SESSION_REPOSITORY,
  SessionStats,
} from './ports/session-repository.port';

@Injectable()
export class ParkingService {
  private readonly logger = new Logger(ParkingService.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: ISessionRepository,
    private readonly vehiclesService: VehiclesService,
    private readonly tariffsService: TariffsService,
    private readonly monthlyPassesService: MonthlyPassesService,
    private readonly spacesService: SpacesService,
    private readonly auditService: AuditService,
    private readonly eventsService: ParkingEventsService,
    private readonly dataSource: DataSource,
  ) {}

  getStats(): Promise<SessionStats> {
    return this.sessionRepo.getStats();
  }

  findAll(
    pagination: PaginationDto,
    status?: SessionStatus,
  ): Promise<PaginatedResult<ParkingSessionOrmEntity>> {
    return this.sessionRepo.findAll(pagination, status);
  }

  async findOne(id: string): Promise<ParkingSessionOrmEntity> {
    const session = await this.sessionRepo.findOne(id);
    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
    return session;
  }

  async findByTicketNumber(ticketNumber: string): Promise<ParkingSessionOrmEntity> {
    const session = await this.sessionRepo.findByTicketNumber(ticketNumber);
    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
    return session;
  }

  async createEntry(
    dto: CreateSessionDto,
    userId: string,
  ): Promise<ParkingSessionOrmEntity> {
    // Pre-transaction reads — validations that don't need locking
    const vehicle = await this.vehiclesService.findOrCreateByPlate(
      dto.plate,
      dto.vehicleType,
    );
    const tariff = await this.tariffsService.findOne(dto.tariffId);

    if (!tariff.isActive) throw new BadRequestException('TARIFF_NOT_ACTIVE');

    const space = await this.spacesService.findByCode(dto.spaceCode);
    this.spacesService.assertCompatible(space, vehicle.type);

    const activePass = await this.monthlyPassesService.findActiveByVehicle(vehicle.id);
    const ticketNumber = await this.sessionRepo.nextTicketNumber();

    // Atomic write: pessimistic lock on space + vehicle check inside the same transaction
    // to prevent duplicate sessions for the same vehicle under concurrent requests.
    const session = await this.dataSource.transaction(async (manager) => {
      const lockedSpace = await manager.findOne(ParkingSpaceOrmEntity, {
        where: { id: space.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedSpace || lockedSpace.status !== SpaceStatus.AVAILABLE) {
        throw new BadRequestException('SPACE_NOT_AVAILABLE');
      }

      // Re-check inside the transaction to prevent the TOCTOU race condition
      // where two concurrent requests for the same vehicle both pass the pre-tx check.
      const activeSession = await manager.findOne(ParkingSessionOrmEntity, {
        where: { vehicleId: vehicle.id, status: SessionStatus.ACTIVE },
      });
      if (activeSession) throw new BadRequestException('VEHICLE_ALREADY_PARKED');

      const newSession = manager.create(ParkingSessionOrmEntity, {
        ticketNumber,
        vehicleId: vehicle.id,
        tariffId: tariff.id,
        entryById: userId,
        entryTime: new Date(),
        status: SessionStatus.ACTIVE,
        notes: dto.notes ?? null,
        monthlyPassId: activePass?.id ?? null,
        spaceId: space.id,
      });

      const saved = await manager.save(newSession);
      await manager.update(ParkingSpaceOrmEntity, space.id, {
        status: SpaceStatus.OCCUPIED,
      });

      return saved;
    });

    this.auditService.log({
      userId,
      action: AuditAction.VEHICLE_ENTRY,
      entityType: 'parking_session',
      entityId: session.id,
      metadata: {
        plate: vehicle.plate,
        ticketNumber,
        spaceCode: space.code,
        hasMonthlyPass: !!activePass,
      },
    }).catch((err) => this.logger.error('Audit log failed (VEHICLE_ENTRY)', err));

    const created = await this.sessionRepo.findOne(session.id) as ParkingSessionOrmEntity;
    this.eventsService.emit('SESSION_UPDATED');
    return created;
  }
}
