import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MonthlyPassesService } from './monthly-passes.service';
import { MonthlyPassOrmEntity } from './infrastructure/orm/monthly-pass.orm-entity';
import { AuditService } from '../audit/audit.service';
import { MONTHLY_PASS_REPOSITORY } from './ports/monthly-pass-repository.port';

const mockPass = (overrides: Partial<MonthlyPassOrmEntity> = {}): MonthlyPassOrmEntity =>
  ({
    id:            'pass-1',
    vehicleId:     'vehicle-1',
    holderName:    'Juan Pérez',
    holderContact: '1134567890',
    validFrom:     '2024-01-01',
    validTo:       '2024-01-31',
    isActive:      true,
    createdAt:     new Date(),
    updatedAt:     new Date(),
    ...overrides,
  } as unknown as MonthlyPassOrmEntity);

describe('MonthlyPassesService', () => {
  let service: MonthlyPassesService;
  let repo: {
    findOne:             jest.Mock;
    findAll:             jest.Mock;
    findActiveByVehicle: jest.Mock;
    create:              jest.Mock;
    save:                jest.Mock;
    softDelete:          jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne:             jest.fn(),
      findAll:             jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      findActiveByVehicle: jest.fn(),
      create:              jest.fn().mockImplementation(d => d),
      save:                jest.fn().mockImplementation(p => Promise.resolve({ ...mockPass(), ...p })),
      softDelete:          jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyPassesService,
        { provide: MONTHLY_PASS_REPOSITORY, useValue: repo },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<MonthlyPassesService>(MonthlyPassesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const validDto = {
      vehicleId:     'vehicle-1',
      holderName:    'Juan',
      holderContact: '1122334455',
      validFrom:     '2024-01-01',
      validTo:       '2024-01-31',
      isActive:      true,
      pricePaid:     5000,
    };

    it('creates the pass when date range is valid', async () => {
      const result = await service.create(validDto);

      expect(repo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws INVALID_DATE_RANGE when validFrom equals validTo', async () => {
      await expect(service.create({ ...validDto, validFrom: '2024-01-15', validTo: '2024-01-15' }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws INVALID_DATE_RANGE when validFrom is after validTo', async () => {
      await expect(service.create({ ...validDto, validFrom: '2024-02-01', validTo: '2024-01-01' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the pass when found', async () => {
      repo.findOne.mockResolvedValue(mockPass());

      const result = await service.findOne('pass-1');

      expect(result.id).toBe('pass-1');
    });

    it('throws MONTHLY_PASS_NOT_FOUND when pass does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findActiveByVehicle ─────────────────────────────────────────────────────

  describe('findActiveByVehicle', () => {
    it('returns the active pass when one exists for the vehicle', async () => {
      const pass = mockPass();
      repo.findActiveByVehicle.mockResolvedValue(pass);

      const result = await service.findActiveByVehicle('vehicle-1');

      expect(result).toBe(pass);
      expect(repo.findActiveByVehicle).toHaveBeenCalledWith('vehicle-1');
    });

    it('returns null when no active pass exists', async () => {
      repo.findActiveByVehicle.mockResolvedValue(null);

      const result = await service.findActiveByVehicle('vehicle-1');

      expect(result).toBeNull();
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('removes the pass when found', async () => {
      repo.findOne.mockResolvedValue(mockPass());

      await service.remove('pass-1');

      expect(repo.softDelete).toHaveBeenCalledWith('pass-1');
    });

    it('throws MONTHLY_PASS_NOT_FOUND when pass does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
