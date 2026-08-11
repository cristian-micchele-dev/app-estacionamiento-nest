import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { TariffOrmEntity } from './infrastructure/orm/tariff.orm-entity';
import { AuditService } from '../audit/audit.service';
import { TARIFF_REPOSITORY } from './ports/tariff-repository.port';

const mockTariff = (overrides: Partial<TariffOrmEntity> = {}): TariffOrmEntity =>
  ({
    id:                 'tariff-1',
    name:               'General',
    pricePerHour:       1200 as any,
    pricePerHalfHour:   700 as any,
    toleranceMinutes:   10,
    dailyMax:           null,
    overnightRate:      null,
    overnightStartHour: 22,
    overnightEndHour:   8,
    isActive:           true,
    effectiveFrom:      new Date('2024-01-01'),
    effectiveTo:        null,
    deletedAt:          null,
    ...overrides,
  } as TariffOrmEntity);

describe('TariffsService', () => {
  let service: TariffsService;
  let repo: { findAll: jest.Mock; findOne: jest.Mock; save: jest.Mock; create: jest.Mock; softRemove: jest.Mock };

  beforeEach(async () => {
    repo = {
      findAll:    jest.fn().mockResolvedValue([]),
      findOne:    jest.fn(),
      save:       jest.fn().mockImplementation(t => Promise.resolve({ ...mockTariff(), ...t })),
      create:     jest.fn().mockImplementation(d => d),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TariffsService,
        { provide: TARIFF_REPOSITORY, useValue: repo },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<TariffsService>(TariffsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all tariffs when no filter is applied', async () => {
      const tariffs = [mockTariff(), mockTariff({ id: 'tariff-2', isActive: false })];
      repo.findAll.mockResolvedValue(tariffs);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(repo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('filters by isActive when activeOnly is true', async () => {
      repo.findAll.mockResolvedValue([mockTariff()]);

      await service.findAll(true);

      expect(repo.findAll).toHaveBeenCalledWith(true);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the tariff when found', async () => {
      repo.findOne.mockResolvedValue(mockTariff());

      const result = await service.findOne('tariff-1');

      expect(result.id).toBe('tariff-1');
    });

    it('throws TARIFF_NOT_FOUND when tariff does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('saves and returns the new tariff', async () => {
      const dto = {
        name:               'Motocicleta',
        pricePerHour:       600,
        pricePerHalfHour:   350,
        toleranceMinutes:   10,
        dailyMax:           null,
        overnightRate:      null,
        overnightStartHour: 22,
        overnightEndHour:   8,
        isActive:           true,
        effectiveFrom:      '2024-01-01',
        effectiveTo:        null,
      };

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('converts effectiveFrom string to Date', async () => {
      await service.create({
        name: 'Test', pricePerHour: 100, pricePerHalfHour: 50,
        toleranceMinutes: 0, dailyMax: null, overnightRate: null,
        overnightStartHour: 22, overnightEndHour: 8, isActive: true,
        effectiveFrom: '2024-06-15', effectiveTo: null,
      });

      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.effectiveFrom).toBeInstanceOf(Date);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-removes the tariff', async () => {
      const tariff = mockTariff();
      repo.findOne.mockResolvedValue(tariff);

      await service.remove('tariff-1');

      expect(repo.softRemove).toHaveBeenCalledWith(tariff);
    });

    it('throws TARIFF_NOT_FOUND when tariff does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
