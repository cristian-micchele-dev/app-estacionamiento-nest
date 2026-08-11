import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SpacesService } from './spaces.service';
import {
  ParkingSpaceOrmEntity,
  SpaceStatus,
  SpaceType,
} from './infrastructure/orm/parking-space.orm-entity';
import { VehicleType } from '../vehicles/infrastructure/orm/vehicle.orm-entity';
import { SPACE_REPOSITORY } from './ports/space-repository.port';

// ─── Factory ─────────────────────────────────────────────────────────────────

function makeSpace(overrides: Partial<ParkingSpaceOrmEntity> = {}): ParkingSpaceOrmEntity {
  return {
    id: 'space-1',
    code: 'A01',
    type: SpaceType.CAR,
    status: SpaceStatus.AVAILABLE,
    ...overrides,
  } as ParkingSpaceOrmEntity;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('SpacesService', () => {
  let service: SpacesService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      findAll:    jest.fn(),
      findOne:    jest.fn(),
      findByCode: jest.fn(),
      create:     jest.fn().mockImplementation((d) => d),
      save:       jest.fn().mockImplementation((e) => Promise.resolve(e)),
      update:     jest.fn().mockResolvedValue(undefined),
      delete:     jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpacesService,
        { provide: SPACE_REPOSITORY, useValue: repo },
      ],
    }).compile();

    service = module.get<SpacesService>(SpacesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns spaces ordered by code', async () => {
      const spaces = [makeSpace({ code: 'A01' }), makeSpace({ code: 'A02' })];
      repo.findAll.mockResolvedValue(spaces);

      const result = await service.findAll();

      expect(repo.findAll).toHaveBeenCalled();
      expect(result).toBe(spaces);
    });

    it('returns empty array when no spaces exist', async () => {
      repo.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the space when found', async () => {
      const space = makeSpace();
      repo.findOne.mockResolvedValue(space);

      await expect(service.findOne('space-1')).resolves.toBe(space);
    });

    it('throws SPACE_NOT_FOUND when space does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByCode ───────────────────────────────────────────────────────────

  describe('findByCode', () => {
    it('returns the space when found', async () => {
      const space = makeSpace();
      repo.findByCode.mockResolvedValue(space);

      await expect(service.findByCode('A01')).resolves.toBe(space);
    });

    it('delegates to repo.findByCode with the given code', async () => {
      repo.findByCode.mockResolvedValue(makeSpace());

      await service.findByCode('A01');

      expect(repo.findByCode).toHaveBeenCalledWith('A01');
    });

    it('throws SPACE_NOT_FOUND when code does not exist', async () => {
      repo.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('Z99')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { code: 'B01', type: SpaceType.MOTORCYCLE };

    it('creates and returns the new space', async () => {
      repo.findByCode.mockResolvedValue(null);
      const saved = makeSpace({ code: 'B01', type: SpaceType.MOTORCYCLE });
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto as any);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(saved);
    });

    it('throws SPACE_CODE_ALREADY_EXISTS when code is taken', async () => {
      repo.findByCode.mockResolvedValue(makeSpace({ code: 'B01' }));

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the space', async () => {
      const space = makeSpace();
      repo.findOne.mockResolvedValue(space);
      repo.save.mockResolvedValue({ ...space, status: SpaceStatus.MAINTENANCE });

      const result = await service.update('space-1', { status: SpaceStatus.MAINTENANCE } as any);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(SpaceStatus.MAINTENANCE);
    });

    it('throws CANNOT_FREE_OCCUPIED_SPACE_MANUALLY when freeing an occupied space', async () => {
      repo.findOne.mockResolvedValue(makeSpace({ status: SpaceStatus.OCCUPIED }));

      await expect(
        service.update('space-1', { status: SpaceStatus.AVAILABLE } as any),
      ).rejects.toThrow(BadRequestException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws SPACE_NOT_FOUND when space does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { status: SpaceStatus.MAINTENANCE } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── markOccupied / markAvailable ────────────────────────────────────────

  describe('markOccupied', () => {
    it('calls repo.update with OCCUPIED status', async () => {
      await service.markOccupied('space-1');

      expect(repo.update).toHaveBeenCalledWith('space-1', { status: SpaceStatus.OCCUPIED });
    });
  });

  describe('markAvailable', () => {
    it('calls repo.update with AVAILABLE status', async () => {
      await service.markAvailable('space-1');

      expect(repo.update).toHaveBeenCalledWith('space-1', { status: SpaceStatus.AVAILABLE });
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes the space when it is not occupied', async () => {
      repo.findOne.mockResolvedValue(makeSpace());

      await service.remove('space-1');

      expect(repo.delete).toHaveBeenCalledWith('space-1');
    });

    it('throws CANNOT_DELETE_OCCUPIED_SPACE when space is occupied', async () => {
      repo.findOne.mockResolvedValue(makeSpace({ status: SpaceStatus.OCCUPIED }));

      await expect(service.remove('space-1')).rejects.toThrow(BadRequestException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('throws SPACE_NOT_FOUND when space does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── assertCompatible ─────────────────────────────────────────────────────

  describe('assertCompatible', () => {
    it('accepts a CAR in a CAR space', () => {
      const space = makeSpace({ type: SpaceType.CAR });

      expect(() => service.assertCompatible(space, VehicleType.CAR)).not.toThrow();
    });

    it('accepts a VAN in a CAR space', () => {
      const space = makeSpace({ type: SpaceType.CAR });

      expect(() => service.assertCompatible(space, VehicleType.VAN)).not.toThrow();
    });

    it('accepts a TRUCK in a CAR space', () => {
      const space = makeSpace({ type: SpaceType.CAR });

      expect(() => service.assertCompatible(space, VehicleType.TRUCK)).not.toThrow();
    });

    it('accepts a BUS in a CAR space', () => {
      const space = makeSpace({ type: SpaceType.CAR });

      expect(() => service.assertCompatible(space, VehicleType.BUS)).not.toThrow();
    });

    it('rejects a MOTORCYCLE in a CAR space', () => {
      const space = makeSpace({ type: SpaceType.CAR });

      expect(() => service.assertCompatible(space, VehicleType.MOTORCYCLE)).toThrow(BadRequestException);
    });

    it('accepts a MOTORCYCLE in a MOTORCYCLE space', () => {
      const space = makeSpace({ type: SpaceType.MOTORCYCLE });

      expect(() => service.assertCompatible(space, VehicleType.MOTORCYCLE)).not.toThrow();
    });

    it('rejects a CAR in a MOTORCYCLE space', () => {
      const space = makeSpace({ type: SpaceType.MOTORCYCLE });

      expect(() => service.assertCompatible(space, VehicleType.CAR)).toThrow(BadRequestException);
    });

    it('accepts a CAR in a DISABLED space', () => {
      const space = makeSpace({ type: SpaceType.DISABLED });

      expect(() => service.assertCompatible(space, VehicleType.CAR)).not.toThrow();
    });

    it('accepts a VAN in a DISABLED space', () => {
      const space = makeSpace({ type: SpaceType.DISABLED });

      expect(() => service.assertCompatible(space, VehicleType.VAN)).not.toThrow();
    });

    it('rejects a TRUCK in a DISABLED space', () => {
      const space = makeSpace({ type: SpaceType.DISABLED });

      expect(() => service.assertCompatible(space, VehicleType.TRUCK)).toThrow(BadRequestException);
    });

    it('rejects a MOTORCYCLE in a DISABLED space', () => {
      const space = makeSpace({ type: SpaceType.DISABLED });

      expect(() => service.assertCompatible(space, VehicleType.MOTORCYCLE)).toThrow(BadRequestException);
    });
  });
});
