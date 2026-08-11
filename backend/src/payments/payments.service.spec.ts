import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PAYMENT_REPOSITORY } from './ports/payment-repository.port';
import { PaymentMethod, PaymentOrmEntity } from './infrastructure/orm/payment.orm-entity';

// ─── Factories ────────────────────────────────────────────────────────────────

function makePayment(overrides: Partial<PaymentOrmEntity> = {}): PaymentOrmEntity {
  return {
    id: 'payment-1',
    ticketId: 'ticket-1',
    shiftId: 'shift-1',
    processedById: 'user-1',
    amount: 500,
    method: PaymentMethod.CASH,
    receivedAmount: 500,
    changeAmount: 0,
    paidAt: new Date('2024-01-01T10:00:00Z'),
    ...overrides,
  } as PaymentOrmEntity;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PaymentsService', () => {
  let service: PaymentsService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      findAll:    jest.fn(),
      findOne:    jest.fn(),
      findByShift: jest.fn(),
      save:       jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create:     jest.fn().mockImplementation((d) => d),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PAYMENT_REPOSITORY, useValue: repo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delegates to the repository with pagination params', async () => {
      const paginated = { data: [makePayment()], total: 1, page: 1, limit: 10, totalPages: 1 };
      repo.findAll.mockResolvedValue(paginated);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(paginated);
    });

    it('returns empty result when no payments exist', async () => {
      const empty = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      repo.findAll.mockResolvedValue(empty);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the payment when found', async () => {
      const payment = makePayment();
      repo.findOne.mockResolvedValue(payment);

      const result = await service.findOne('payment-1');

      expect(repo.findOne).toHaveBeenCalledWith('payment-1');
      expect(result).toEqual(payment);
    });

    it('throws NotFoundException when payment does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByShift ─────────────────────────────────────────────────────────────

  describe('findByShift', () => {
    it('returns all payments for the given shift', async () => {
      const payments = [makePayment(), makePayment({ id: 'payment-2' })];
      repo.findByShift.mockResolvedValue(payments);

      const result = await service.findByShift('shift-1');

      expect(repo.findByShift).toHaveBeenCalledWith('shift-1');
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when no payments exist for the shift', async () => {
      repo.findByShift.mockResolvedValue([]);

      const result = await service.findByShift('shift-empty');

      expect(result).toEqual([]);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and saves a CASH payment with the given params', async () => {
      const params = {
        ticketId:       'ticket-1',
        shiftId:        'shift-1',
        processedById:  'user-1',
        amount:         750,
        method:         PaymentMethod.CASH,
        receivedAmount: 1000,
        changeAmount:   250,
        paidAt:         new Date(),
      };

      const created = makePayment({ amount: 750, method: PaymentMethod.CASH });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(params);

      expect(repo.create).toHaveBeenCalledWith(params);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result.amount).toBe(750);
      expect(result.method).toBe(PaymentMethod.CASH);
    });

    it('creates a CARD payment with null receivedAmount and changeAmount', async () => {
      const params = {
        ticketId:       'ticket-2',
        shiftId:        null,
        processedById:  'user-1',
        amount:         300,
        method:         PaymentMethod.CARD,
        receivedAmount: null,
        changeAmount:   null,
        paidAt:         new Date(),
      };

      const created = makePayment({ amount: 300, method: PaymentMethod.CARD, shiftId: null, receivedAmount: null, changeAmount: null });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(params);

      expect(result.method).toBe(PaymentMethod.CARD);
      expect(result.receivedAmount).toBeNull();
      expect(result.changeAmount).toBeNull();
    });

    it('creates a MONTHLY_PASS payment with shiftId null', async () => {
      const params = {
        ticketId:       'ticket-3',
        shiftId:        null,
        processedById:  'user-1',
        amount:         0,
        method:         PaymentMethod.MONTHLY_PASS,
        receivedAmount: null,
        changeAmount:   null,
        paidAt:         new Date(),
      };

      const created = makePayment({ amount: 0, method: PaymentMethod.MONTHLY_PASS, shiftId: null });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(params);

      expect(result.method).toBe(PaymentMethod.MONTHLY_PASS);
      expect(result.shiftId).toBeNull();
    });
  });
});
