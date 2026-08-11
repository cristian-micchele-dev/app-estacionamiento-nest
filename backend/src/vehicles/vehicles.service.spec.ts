import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehicleOrmEntity, VehicleType } from './infrastructure/orm/vehicle.orm-entity';
import { VEHICLE_REPOSITORY } from './ports/vehicle-repository.port';

const mockVehicle = (overrides: Partial<VehicleOrmEntity> = {}): VehicleOrmEntity =>
  ({
    id:        'vehicle-1',
    plate:     'ABC123',
    type:      VehicleType.CAR,
    brand:     null,
    model:     null,
    color:     null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as VehicleOrmEntity);

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repo: {
    findOne:               jest.Mock;
    findByPlate:           jest.Mock;
    findByPlateWithDeleted: jest.Mock;
    findAll:               jest.Mock;
    create:                jest.Mock;
    save:                  jest.Mock;
    softDelete:            jest.Mock;
    restore:               jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne:               jest.fn(),
      findByPlate:           jest.fn(),
      findByPlateWithDeleted: jest.fn(),
      findAll:               jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      create:                jest.fn().mockImplementation(d => d),
      save:                  jest.fn().mockImplementation(v => Promise.resolve({ ...mockVehicle(), ...v })),
      softDelete:            jest.fn().mockResolvedValue(undefined),
      restore:               jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: VEHICLE_REPOSITORY, useValue: repo },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findOrCreateByPlate ─────────────────────────────────────────────────────

  describe('findOrCreateByPlate', () => {
    it('returns existing vehicle when plate is found', async () => {
      const existing = mockVehicle();
      repo.findByPlateWithDeleted.mockResolvedValue(existing);

      const result = await service.findOrCreateByPlate('ABC123');

      expect(result).toBe(existing);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates a new vehicle when plate is not found', async () => {
      repo.findByPlateWithDeleted.mockResolvedValue(null);

      await service.findOrCreateByPlate('XYZ999', VehicleType.MOTORCYCLE);

      expect(repo.save).toHaveBeenCalled();
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.plate).toBe('XYZ999');
      expect(createArg.type).toBe(VehicleType.MOTORCYCLE);
    });

    it('uppercases the plate before saving', async () => {
      repo.findByPlateWithDeleted.mockResolvedValue(null);

      await service.findOrCreateByPlate('abc123');

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.plate).toBe('ABC123');
    });

    it('defaults to CAR type when no type is provided', async () => {
      repo.findByPlateWithDeleted.mockResolvedValue(null);

      await service.findOrCreateByPlate('NEW001');

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.type).toBe(VehicleType.CAR);
    });

    it('restores a soft-deleted vehicle instead of creating a new one', async () => {
      const deleted = mockVehicle({ deletedAt: new Date() });
      repo.findByPlateWithDeleted.mockResolvedValue(deleted);

      const result = await service.findOrCreateByPlate('ABC123');

      expect(repo.restore).toHaveBeenCalledWith('vehicle-1');
      expect(result.deletedAt).toBeNull();
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('saves and returns the new vehicle', async () => {
      repo.findByPlate.mockResolvedValue(null);

      const result = await service.create({ plate: 'new001', type: VehicleType.CAR });

      expect(result).toBeDefined();
      expect(repo.save).toHaveBeenCalled();
    });

    it('uppercases the plate before saving', async () => {
      repo.findByPlate.mockResolvedValue(null);

      await service.create({ plate: 'abc999', type: VehicleType.CAR });

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.plate).toBe('ABC999');
    });

    it('throws PLATE_ALREADY_EXISTS when plate is taken', async () => {
      repo.findByPlate.mockResolvedValue(mockVehicle());

      await expect(service.create({ plate: 'ABC123', type: VehicleType.CAR }))
        .rejects.toThrow(ConflictException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the vehicle when found', async () => {
      repo.findOne.mockResolvedValue(mockVehicle());

      const result = await service.findOne('vehicle-1');

      expect(result.id).toBe('vehicle-1');
    });

    it('throws VEHICLE_NOT_FOUND when vehicle does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes the vehicle when found', async () => {
      const vehicle = mockVehicle();
      repo.findOne.mockResolvedValue(vehicle);

      await service.remove('vehicle-1');

      expect(repo.softDelete).toHaveBeenCalledWith('vehicle-1');
    });

    it('throws VEHICLE_NOT_FOUND when vehicle does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
