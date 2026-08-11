import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ParkingService } from './parking.service';
import { SESSION_REPOSITORY } from './ports/session-repository.port';
import { VehiclesService } from '../vehicles/vehicles.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { MonthlyPassesService } from '../monthly-passes/monthly-passes.service';
import { SpacesService } from '../spaces/spaces.service';
import { AuditService } from '../audit/audit.service';
import { ParkingEventsService } from './parking-events.service';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from './infrastructure/orm/parking-session.orm-entity';
import {
  ParkingSpaceOrmEntity,
  SpaceStatus,
  SpaceType,
} from '../spaces/infrastructure/orm/parking-space.orm-entity';
import { TariffOrmEntity } from '../tariffs/infrastructure/orm/tariff.orm-entity';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeTariff(overrides: Partial<TariffOrmEntity> = {}): TariffOrmEntity {
  return { id: 't-1', isActive: true, ...overrides } as TariffOrmEntity;
}

function makeSession(overrides: Partial<ParkingSessionOrmEntity> = {}): ParkingSessionOrmEntity {
  return { id: 'session-1', status: SessionStatus.ACTIVE, ...overrides } as ParkingSessionOrmEntity;
}

function makeSpace(overrides: Partial<ParkingSpaceOrmEntity> = {}): ParkingSpaceOrmEntity {
  return {
    id: 'space-1',
    code: 'A01',
    type: SpaceType.CAR,
    status: SpaceStatus.AVAILABLE,
    ...overrides,
  } as ParkingSpaceOrmEntity;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ParkingService', () => {
  let service: ParkingService;
  let sessionRepo: Record<string, jest.Mock>;
  let vehiclesService: Record<string, jest.Mock>;
  let tariffsService: Record<string, jest.Mock>;
  let monthlyPassesService: Record<string, jest.Mock>;
  let spacesService: Record<string, jest.Mock>;
  let txManager: Record<string, jest.Mock>;
  let dataSource: Partial<DataSource>;

  beforeEach(async () => {
    txManager = {
      // Entity-aware: space check returns available space, vehicle session check returns null
      findOne: jest.fn().mockImplementation((entity: unknown) => {
        if (entity === ParkingSpaceOrmEntity) return Promise.resolve(makeSpace());
        if (entity === ParkingSessionOrmEntity) return Promise.resolve(null); // no active session
        return Promise.resolve(null);
      }),
      create:  jest.fn().mockImplementation((_cls, d) => d),
      save:    jest.fn().mockImplementation((e) => Promise.resolve(e)),
      update:  jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation((cb: (m: unknown) => Promise<unknown>) =>
        cb(txManager),
      ),
    };

    sessionRepo = {
      findAll:             jest.fn(),
      findOne:             jest.fn().mockResolvedValue(makeSession()),
      findActiveByVehicle: jest.fn().mockResolvedValue(null),
      save:                jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create:              jest.fn().mockImplementation((d) => d),
      getStats:            jest.fn(),
      nextTicketNumber:    jest.fn().mockResolvedValue('TK-20240101-0001'),
      findByTicketNumber:  jest.fn(),
    };

    vehiclesService = {
      findOrCreateByPlate: jest.fn().mockResolvedValue({ id: 'v-1', plate: 'ABC123', type: 'CAR' }),
    };

    tariffsService = {
      findOne: jest.fn().mockResolvedValue(makeTariff()),
    };

    monthlyPassesService = {
      findActiveByVehicle: jest.fn().mockResolvedValue(null),
    };

    spacesService = {
      findByCode:       jest.fn().mockResolvedValue(makeSpace()),
      assertCompatible: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingService,
        { provide: SESSION_REPOSITORY,   useValue: sessionRepo },
        { provide: VehiclesService,      useValue: vehiclesService },
        { provide: TariffsService,       useValue: tariffsService },
        { provide: MonthlyPassesService, useValue: monthlyPassesService },
        { provide: SpacesService,        useValue: spacesService },
        { provide: AuditService,         useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: ParkingEventsService, useValue: { emit: jest.fn() } },
        { provide: DataSource,           useValue: dataSource },
      ],
    }).compile();

    service = module.get<ParkingService>(ParkingService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the session when found', async () => {
      const session = makeSession();
      sessionRepo.findOne.mockResolvedValue(session);

      await expect(service.findOne('session-1')).resolves.toBe(session);
    });

    it('throws SESSION_NOT_FOUND when the session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('session-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createEntry ─────────────────────────────────────────────────────────────

  describe('createEntry', () => {
    const dto = { plate: 'ABC123', tariffId: 't-1', spaceCode: 'A01' } as any;

    it('throws TARIFF_NOT_ACTIVE when tariff is inactive', async () => {
      tariffsService.findOne.mockResolvedValue(makeTariff({ isActive: false }));

      await expect(service.createEntry(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws VEHICLE_ALREADY_PARKED when an active session exists for the vehicle', async () => {
      // Active session check is now inside the transaction via manager.findOne
      txManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === ParkingSpaceOrmEntity) return Promise.resolve(makeSpace());
        if (entity === ParkingSessionOrmEntity) return Promise.resolve(makeSession()); // active!
        return Promise.resolve(null);
      });

      await expect(service.createEntry(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('throws SPACE_NOT_AVAILABLE when space is occupied inside transaction', async () => {
      txManager.findOne.mockImplementation((entity: unknown) => {
        if (entity === ParkingSpaceOrmEntity) return Promise.resolve(makeSpace({ status: SpaceStatus.OCCUPIED }));
        return Promise.resolve(null); // no active session for vehicle
      });

      await expect(service.createEntry(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('creates the session inside a transaction', async () => {
      const created = makeSession({ id: 'new-session' });
      sessionRepo.findOne.mockResolvedValue(created);

      const result = await service.createEntry(dto, 'user-1');

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      // save: session; update: space status
      expect(txManager.save).toHaveBeenCalledTimes(1);
      expect(txManager.update).toHaveBeenCalledTimes(1);
      expect(result).toBe(created);
    });

    it('marks space as OCCUPIED inside transaction', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());

      await service.createEntry(dto, 'user-1');

      expect(txManager.update).toHaveBeenCalledWith(
        ParkingSpaceOrmEntity,
        'space-1',
        { status: SpaceStatus.OCCUPIED },
      );
    });

    it('generates a ticket number', async () => {
      await service.createEntry(dto, 'user-1');

      expect(sessionRepo.nextTicketNumber).toHaveBeenCalledTimes(1);
    });

    it('links the active monthly pass when one exists', async () => {
      monthlyPassesService.findActiveByVehicle.mockResolvedValue({ id: 'pass-1' });
      sessionRepo.findOne.mockResolvedValue(makeSession());

      await service.createEntry(dto, 'user-1');

      expect(txManager.create).toHaveBeenCalledWith(
        ParkingSessionOrmEntity,
        expect.objectContaining({ monthlyPassId: 'pass-1' }),
      );
    });

    it('sets monthlyPassId to null when no pass is active', async () => {
      monthlyPassesService.findActiveByVehicle.mockResolvedValue(null);
      sessionRepo.findOne.mockResolvedValue(makeSession());

      await service.createEntry(dto, 'user-1');

      expect(txManager.create).toHaveBeenCalledWith(
        ParkingSessionOrmEntity,
        expect.objectContaining({ monthlyPassId: null }),
      );
    });
  });
});
