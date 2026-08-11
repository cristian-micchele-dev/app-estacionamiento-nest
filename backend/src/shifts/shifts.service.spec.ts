import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftOrmEntity, ShiftStatus } from './infrastructure/orm/shift.orm-entity';
import { PaymentsService } from '../payments/payments.service';
import { PaymentMethod } from '../payments/infrastructure/orm/payment.orm-entity';
import { AuditService } from '../audit/audit.service';
import { SHIFT_REPOSITORY } from './ports/shift-repository.port';

const mockShift = (overrides: Partial<ShiftOrmEntity> = {}): ShiftOrmEntity =>
  ({
    id:                    'shift-1',
    cashierId:             'user-1',
    status:                ShiftStatus.OPEN,
    openingBalance:        5000 as any,
    openedAt:              new Date(),
    closedAt:              null,
    closingBalanceCounted: null,
    closingBalanceSystem:  null,
    difference:            null,
    notes:                 null,
    ...overrides,
  } as ShiftOrmEntity);

describe('ShiftsService', () => {
  let service: ShiftsService;
  let repo: { findOne: jest.Mock; findActive: jest.Mock; findAll: jest.Mock; save: jest.Mock; create: jest.Mock };
  let paymentsService: { findByShift: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne:    jest.fn(),
      findActive: jest.fn(),
      findAll:    jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      save:       jest.fn().mockImplementation(s => Promise.resolve(s)),
      create:     jest.fn().mockImplementation(d => d),
    };

    paymentsService = {
      findByShift: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: SHIFT_REPOSITORY, useValue: repo },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: AuditService,    useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── open ────────────────────────────────────────────────────────────────────

  describe('open', () => {
    it('creates a new shift when no shift is open', async () => {
      repo.findActive.mockResolvedValue(null); // no active shift

      const result = await service.open('user-1', { openingBalance: 5000 });

      expect(repo.save).toHaveBeenCalled();
      expect(result.status).toBe(ShiftStatus.OPEN);
      expect(result.openingBalance).toBe(5000);
    });

    it('throws SHIFT_ALREADY_OPEN when an open shift exists', async () => {
      repo.findActive.mockResolvedValue(mockShift()); // active shift found

      await expect(service.open('user-1', { openingBalance: 1000 }))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ─── close ───────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('closes shift and calculates system balance using only CASH payments', async () => {
      repo.findOne.mockResolvedValue(mockShift({ openingBalance: 5000 as any }));
      paymentsService.findByShift.mockResolvedValue([
        { amount: 1200, method: PaymentMethod.CASH },
        { amount: 800,  method: PaymentMethod.CASH },
      ]);

      const result = await service.close('shift-1', { closingBalanceCounted: 7500 });

      // systemBalance = 5000 + 1200 + 800 = 7000
      expect(result.closingBalanceSystem).toBe(7000);
      // difference = 7500 (counted) - 7000 (system) = 500
      expect(result.difference).toBe(500);
      expect(result.status).toBe(ShiftStatus.CLOSED);
    });

    it('excludes card and transfer payments from system balance', async () => {
      repo.findOne.mockResolvedValue(mockShift({ openingBalance: 5000 as any }));
      paymentsService.findByShift.mockResolvedValue([
        { amount: 1000, method: PaymentMethod.CASH },
        { amount: 2000, method: PaymentMethod.CARD },
        { amount: 500,  method: PaymentMethod.TRANSFER },
      ]);

      const result = await service.close('shift-1', { closingBalanceCounted: 6000 });

      // systemBalance = 5000 + 1000 (cash only) = 6000; card/transfer ignored
      expect(result.closingBalanceSystem).toBe(6000);
      expect(result.difference).toBe(0);
    });

    it('records a negative difference when cash is short', async () => {
      repo.findOne.mockResolvedValue(mockShift({ openingBalance: 5000 as any }));
      paymentsService.findByShift.mockResolvedValue([
        { amount: 1000, method: PaymentMethod.CASH },
      ]);

      const result = await service.close('shift-1', { closingBalanceCounted: 5500 });

      // systemBalance = 5000 + 1000 = 6000
      // difference = 5500 - 6000 = -500
      expect(result.difference).toBe(-500);
    });

    it('throws SHIFT_NOT_FOUND when shift does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.close('non-existent', { closingBalanceCounted: 0 }))
        .rejects.toThrow(NotFoundException);
    });

    it('throws SHIFT_ALREADY_CLOSED when shift is not open', async () => {
      repo.findOne.mockResolvedValue(mockShift({ status: ShiftStatus.CLOSED }));

      await expect(service.close('shift-1', { closingBalanceCounted: 0 }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
