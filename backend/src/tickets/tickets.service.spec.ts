import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TicketsService } from './tickets.service';
import { TicketOrmEntity, TicketStatus } from './infrastructure/orm/ticket.orm-entity';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from '../parking/infrastructure/orm/parking-session.orm-entity';
import { PaymentOrmEntity } from '../payments/infrastructure/orm/payment.orm-entity';
import { ParkingExitService } from '../parking/parking-exit.service';
import { ParkingEventsService } from '../parking/parking-events.service';
import { PayTicketDto } from './dto/pay-ticket.dto';
import { TICKET_REPOSITORY } from './ports/ticket-repository.port';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeTicket(overrides: Partial<TicketOrmEntity> = {}): TicketOrmEntity {
  return {
    id: 'ticket-1',
    sessionId: 'session-1',
    status: TicketStatus.PENDING,
    durationMinutes: 60,
    subtotal: 500 as any,
    discountAmount: 0 as any,
    totalAmount: 500 as any,
    ...overrides,
  } as TicketOrmEntity;
}

function makeSession(overrides: Partial<ParkingSessionOrmEntity> = {}): ParkingSessionOrmEntity {
  return {
    id: 'session-1',
    status: SessionStatus.ACTIVE,
    monthlyPassId: null,
    ...overrides,
  } as ParkingSessionOrmEntity;
}

// receivedAmount: 500 matches the default ticket subtotal (no discount)
const cashDto: PayTicketDto = { paymentMethod: 'CASH', receivedAmount: 500 } as any;

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TicketsService', () => {
  let service: TicketsService;
  let repo: Record<string, jest.Mock>;
  let qrManager: Record<string, jest.Mock>;
  let queryRunner: Record<string, jest.Mock>;
  let dataSource: Partial<DataSource>;
  let exitService: Record<string, jest.Mock>;
  let eventsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    qrManager = {
      findOne: jest.fn(),
      save:    jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create:  jest.fn().mockImplementation((_cls, d) => d),
    };

    queryRunner = {
      connect:             jest.fn().mockResolvedValue(undefined),
      startTransaction:    jest.fn().mockResolvedValue(undefined),
      commitTransaction:   jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release:             jest.fn().mockResolvedValue(undefined),
      manager:             qrManager as any,
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    exitService = {
      closeSession: jest.fn().mockResolvedValue(makeSession({ status: SessionStatus.COMPLETED as any })),
    };

    eventsService = {
      emit: jest.fn(),
    };

    repo = {
      findOne: jest.fn(),
      save:    jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TICKET_REPOSITORY,    useValue: repo },
        { provide: DataSource,           useValue: dataSource },
        { provide: ParkingExitService,   useValue: exitService },
        { provide: ParkingEventsService, useValue: eventsService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('changes status to CANCELLED for a PENDING ticket', async () => {
      const ticket = makeTicket();
      repo.findOne.mockResolvedValue(ticket);

      const result = await service.cancel('ticket-1');

      expect(result.status).toBe(TicketStatus.CANCELLED);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TicketStatus.CANCELLED }),
      );
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.cancel('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when ticket is PAID', async () => {
      repo.findOne.mockResolvedValue(makeTicket({ status: TicketStatus.PAID }));

      await expect(service.cancel('ticket-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when ticket is already CANCELLED', async () => {
      repo.findOne.mockResolvedValue(makeTicket({ status: TicketStatus.CANCELLED }));

      await expect(service.cancel('ticket-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── pay ─────────────────────────────────────────────────────────────────────

  describe('pay', () => {
    // helpers to set up the two findOne calls inside the transaction
    function setupHappyPath(
      ticketOverrides: Partial<TicketOrmEntity> = {},
      sessionOverrides: Partial<ParkingSessionOrmEntity> = {},
    ) {
      qrManager.findOne
        .mockResolvedValueOnce(makeTicket(ticketOverrides))   // 1st: TicketOrmEntity
        .mockResolvedValueOnce(makeSession(sessionOverrides)); // 2nd: ParkingSessionOrmEntity
    }

    it('throws TICKET_NOT_FOUND when ticket does not exist', async () => {
      qrManager.findOne.mockResolvedValueOnce(null);

      await expect(service.pay('ticket-1', cashDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws TICKET_NOT_PAYABLE when ticket is not PENDING', async () => {
      qrManager.findOne.mockResolvedValueOnce(makeTicket({ status: TicketStatus.PAID }));

      await expect(service.pay('ticket-1', cashDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      qrManager.findOne
        .mockResolvedValueOnce(makeTicket())
        .mockResolvedValueOnce(null);

      await expect(service.pay('ticket-1', cashDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws SESSION_NOT_ACTIVE when session is already completed', async () => {
      qrManager.findOne
        .mockResolvedValueOnce(makeTicket())
        .mockResolvedValueOnce(makeSession({ status: 'COMPLETED' as any }));

      await expect(service.pay('ticket-1', cashDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('commits the transaction and emits SESSION_UPDATED on success', async () => {
      setupHappyPath();

      await service.pay('ticket-1', cashDto, 'user-1');

      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(eventsService.emit).toHaveBeenCalledWith('SESSION_UPDATED');
    });

    it('releases the query runner after commit', async () => {
      setupHappyPath();

      await service.pay('ticket-1', cashDto, 'user-1');

      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('releases the query runner even on error', async () => {
      qrManager.findOne.mockResolvedValueOnce(null); // triggers rollback

      await expect(service.pay('ticket-1', cashDto, 'user-1')).rejects.toThrow();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('marks ticket as PAID', async () => {
      setupHappyPath();

      const result = await service.pay('ticket-1', cashDto, 'user-1');

      expect(result.ticket.status).toBe(TicketStatus.PAID);
    });

    it('applies PERCENTAGE discount correctly', async () => {
      setupHappyPath(); // subtotal = 500

      const dto: PayTicketDto = {
        paymentMethod: 'CASH',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        receivedAmount: 450, // totalAmount after 10% discount = 450
      } as any;

      const result = await service.pay('ticket-1', dto, 'user-1');

      // 10% of 500 = 50 discount → total = 450
      expect(result.ticket.discountAmount).toBe(50);
      expect(result.ticket.totalAmount).toBe(450);
    });

    it('applies FIXED discount correctly', async () => {
      setupHappyPath(); // subtotal = 500

      const dto: PayTicketDto = {
        paymentMethod: 'CASH',
        discountType: 'FIXED',
        discountValue: 100,
        receivedAmount: 400, // totalAmount after $100 discount = 400
      } as any;

      const result = await service.pay('ticket-1', dto, 'user-1');

      expect(result.ticket.discountAmount).toBe(100);
      expect(result.ticket.totalAmount).toBe(400);
    });

    it('overrides payment to MONTHLY_PASS and sets discount to 0 when pass is active', async () => {
      setupHappyPath({}, { monthlyPassId: 'pass-1' });

      const dto: PayTicketDto = {
        paymentMethod: 'CASH', // should be overridden
        discountType: 'PERCENTAGE',
        discountValue: 50, // should be ignored
      } as any;

      const result = await service.pay('ticket-1', dto, 'user-1');

      expect(result.ticket.discountAmount).toBe(0);
      // payment created with MONTHLY_PASS method
      expect(qrManager.create).toHaveBeenCalledWith(
        PaymentOrmEntity,
        expect.objectContaining({ method: 'MONTHLY_PASS' }),
      );
    });

    it('calls exitService.closeSession with the correct sessionId', async () => {
      setupHappyPath();

      await service.pay('ticket-1', cashDto, 'user-1');

      expect(exitService.closeSession).toHaveBeenCalledWith(
        'session-1',
        'user-1',
        undefined,
        qrManager,
      );
    });

    it('creates a payment record with the correct amount', async () => {
      setupHappyPath(); // subtotal = 500, no discount

      await service.pay('ticket-1', cashDto, 'user-1');

      expect(qrManager.create).toHaveBeenCalledWith(
        PaymentOrmEntity,
        expect.objectContaining({ amount: 500 }),
      );
    });

    it('throws DISCOUNT_PERCENTAGE_OUT_OF_RANGE when percentage > 100', async () => {
      setupHappyPath();

      const dto: PayTicketDto = {
        paymentMethod: 'CASH',
        discountType: 'PERCENTAGE',
        discountValue: 150,
      } as any;

      await expect(service.pay('ticket-1', dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws DISCOUNT_EXCEEDS_SUBTOTAL when fixed discount > subtotal', async () => {
      setupHappyPath(); // subtotal = 500

      const dto: PayTicketDto = {
        paymentMethod: 'CASH',
        discountType: 'FIXED',
        discountValue: 9999,
      } as any;

      await expect(service.pay('ticket-1', dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws RECEIVED_AMOUNT_REQUIRED_FOR_CASH when method is CASH and receivedAmount is missing', async () => {
      setupHappyPath();

      const dto: PayTicketDto = { paymentMethod: 'CASH' } as any;

      await expect(service.pay('ticket-1', dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('throws RECEIVED_AMOUNT_INSUFFICIENT when receivedAmount is less than totalAmount', async () => {
      setupHappyPath(); // subtotal = totalAmount = 500

      const dto: PayTicketDto = { paymentMethod: 'CASH', receivedAmount: 499 } as any;

      await expect(service.pay('ticket-1', dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
