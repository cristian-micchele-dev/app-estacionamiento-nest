import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ParkingExitService } from './parking-exit.service';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from './infrastructure/orm/parking-session.orm-entity';
import {
  TicketOrmEntity,
  TicketStatus,
} from '../tickets/infrastructure/orm/ticket.orm-entity';
import { TariffOrmEntity } from '../tariffs/infrastructure/orm/tariff.orm-entity';
import {
  ParkingSpaceOrmEntity,
  SpaceStatus,
} from '../spaces/infrastructure/orm/parking-space.orm-entity';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeTariff(overrides: Partial<TariffOrmEntity> = {}): TariffOrmEntity {
  return {
    pricePerHour:        1200,
    pricePerHalfHour:    600,
    toleranceMinutes:    10,
    dailyMax:            null,
    overnightRate:       null,
    overnightStartHour:  22,
    overnightEndHour:    8,
    ...overrides,
  } as TariffOrmEntity;
}

function makeSession(
  overrides: Partial<ParkingSessionOrmEntity> = {},
): ParkingSessionOrmEntity {
  return {
    id:            'session-1',
    status:        SessionStatus.ACTIVE,
    monthlyPassId: null,
    spaceId:       null,
    entryTime:     new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    tariff:        makeTariff(),
    ...overrides,
  } as ParkingSessionOrmEntity;
}

/** Builds a Date for today at the given hour:minute. */
function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ParkingExitService', () => {
  let service: ParkingExitService;
  let sessionRepo: Record<string, jest.Mock>;
  // txManager is the EntityManager passed inside the checkout() transaction
  let txManager: Record<string, jest.Mock>;
  let dataSource: Partial<DataSource>;

  beforeEach(async () => {
    sessionRepo = { findOne: jest.fn() };

    txManager = {
      findOne: jest.fn().mockResolvedValue(null), // no existing PENDING ticket by default
      create:  jest.fn().mockImplementation((_cls: unknown, data: unknown) => data),
      save:    jest.fn().mockImplementation((e: unknown) => Promise.resolve(e)),
    };

    dataSource = {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        if (entity === ParkingSessionOrmEntity) return sessionRepo;
        return {};
      }),
      transaction: jest.fn().mockImplementation((cb: (m: unknown) => Promise<unknown>) =>
        cb(txManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingExitService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ParkingExitService>(ParkingExitService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── checkout ─────────────────────────────────────────────────────────────

  describe('checkout', () => {
    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(service.checkout('session-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws SESSION_NOT_ACTIVE when session is already completed', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({ status: SessionStatus.COMPLETED }),
      );

      await expect(service.checkout('session-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns existing PENDING ticket without creating a new one (idempotent)', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      const existing = {
        id: 'ticket-existing',
        status: TicketStatus.PENDING,
      } as TicketOrmEntity;
      txManager.findOne.mockResolvedValue(existing);

      const result = await service.checkout('session-1');

      expect(result).toBe(existing);
      expect(txManager.save).not.toHaveBeenCalled();
    });

    it('creates ticket with 0 amount for monthly pass session', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({ monthlyPassId: 'pass-1' }),
      );

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 0, totalAmount: 0 }),
      );
    });

    it('creates ticket with PENDING status', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ status: TicketStatus.PENDING }),
      );
    });

    // ── Billing logic ──────────────────────────────────────────────────────

    it('charges 0 when session duration is within tolerance window', async () => {
      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
          tariff:    makeTariff({ toleranceMinutes: 10 }),
        }),
      );

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 0, totalAmount: 0 }),
      );
    });

    it('bills in half-hour blocks: 60 min at $600/half-hour → $1200', async () => {
      // 60 min, no tolerance → 2 blocks × $600 = $1200
      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: new Date(Date.now() - 60 * 60 * 1000),
          tariff:    makeTariff({ toleranceMinutes: 0, pricePerHalfHour: 600 }),
        }),
      );

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 1200, totalAmount: 1200 }),
      );
    });

    it('rounds partial blocks up: 45 min at $600/half-hour → $1200 (2 full blocks)', async () => {
      // 45 min, no tolerance → ceil(45/30) = 2 blocks × $600 = $1200
      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: new Date(Date.now() - 45 * 60 * 1000),
          tariff:    makeTariff({ toleranceMinutes: 0, pricePerHalfHour: 600 }),
        }),
      );

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 1200 }),
      );
    });

    it('bills only billable minutes after tolerance: 70 min - 10 tolerance → 1 block = $600', async () => {
      // 70 min total, 10 tolerance → 60 billable → 2 blocks × $300/half = $600
      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: new Date(Date.now() - 70 * 60 * 1000),
          tariff:    makeTariff({ toleranceMinutes: 10, pricePerHalfHour: 300 }),
        }),
      );

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 600 }),
      );
    });

    it('caps amount at dailyMax when blocks exceed it', async () => {
      // 60 min, pricePerHalfHour $600 → 2 blocks = $1200, capped at $500
      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: new Date(Date.now() - 60 * 60 * 1000),
          tariff:    makeTariff({ toleranceMinutes: 0, pricePerHalfHour: 600, dailyMax: 500 }),
        }),
      );

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 500, totalAmount: 500 }),
      );
    });

    // ── Overnight rate ─────────────────────────────────────────────────────

    it('applies overnight rate for a purely nocturnal session (23:00 → 01:00)', async () => {
      // 120 min overnight, overnightRate $120/h → $60/block
      // ceil(120/30) = 4 blocks × $60 = $240
      const entry = todayAt(23, 0);
      const exit  = new Date(entry.getTime() + 120 * 60 * 1000); // +2h

      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: entry,
          tariff: makeTariff({
            toleranceMinutes:   0,
            pricePerHalfHour:   500,   // daytime rate (not used here)
            overnightRate:      120,   // $120/h → $60 per half-hour block
            overnightStartHour: 22,
            overnightEndHour:   8,
          }),
        }),
      );

      // Override Date.now so checkout() calculates duration using `exit`
      const OriginalDate1 = Date;
      jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
        if (args.length === 0) return exit as any;
        return new OriginalDate1(...(args as []));
      });

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 240 }),
      );
    });

    it('applies mixed rates for a session crossing the overnight threshold (21:00 → 23:00)', async () => {
      // 60 min daytime (21:00-22:00) + 60 min overnight (22:00-23:00)
      // daytime:   ceil(60/30) = 2 blocks × $500 = $1000
      // overnight: ceil(60/30) = 2 blocks × $60  = $120
      // total: $1120
      const entry = todayAt(21, 0);
      const exit  = new Date(entry.getTime() + 120 * 60 * 1000); // +2h

      sessionRepo.findOne.mockResolvedValue(
        makeSession({
          entryTime: entry,
          tariff: makeTariff({
            toleranceMinutes:   0,
            pricePerHalfHour:   500,
            overnightRate:      120,   // $60/block
            overnightStartHour: 22,
            overnightEndHour:   8,
          }),
        }),
      );

      const OriginalDate2 = Date;
      jest.spyOn(global, 'Date').mockImplementation((...args: any[]) => {
        if (args.length === 0) return exit as any;
        return new OriginalDate2(...(args as []));
      });

      await service.checkout('session-1');

      expect(txManager.create).toHaveBeenCalledWith(
        TicketOrmEntity,
        expect.objectContaining({ subtotal: 1120 }),
      );
    });
  });

  // ─── closeSession ─────────────────────────────────────────────────────────

  describe('closeSession', () => {
    let manager: Partial<EntityManager>;

    beforeEach(() => {
      manager = {
        findOne: jest.fn(),
        save:    jest.fn().mockImplementation((e) => Promise.resolve(e)),
        update:  jest.fn().mockResolvedValue(undefined),
      };
    });

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      (manager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.closeSession('session-1', 'user-1', undefined, manager as EntityManager),
      ).rejects.toThrow(NotFoundException);
    });

    it('marks session as COMPLETED', async () => {
      const session = makeSession();
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', undefined, manager as EntityManager);

      expect(session.status).toBe(SessionStatus.COMPLETED);
    });

    it('sets exitTime and exitById', async () => {
      const session = makeSession();
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', undefined, manager as EntityManager);

      expect(session.exitById).toBe('user-1');
      expect(session.exitTime).toBeInstanceOf(Date);
    });

    it('sets notes when provided', async () => {
      const session = makeSession();
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', 'some note', manager as EntityManager);

      expect(session.notes).toBe('some note');
    });

    it('does not set notes when not provided', async () => {
      const session = makeSession();
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', undefined, manager as EntityManager);

      expect(session.notes).toBeUndefined();
    });

    it('releases the space when spaceId is set', async () => {
      const session = makeSession({ spaceId: 'space-1' });
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', undefined, manager as EntityManager);

      expect(manager.update).toHaveBeenCalledWith(
        ParkingSpaceOrmEntity,
        'space-1',
        { status: SpaceStatus.AVAILABLE },
      );
    });

    it('does not call update when spaceId is null', async () => {
      const session = makeSession({ spaceId: null });
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', undefined, manager as EntityManager);

      expect(manager.update).not.toHaveBeenCalled();
    });

    it('persists the session via manager.save', async () => {
      const session = makeSession();
      (manager.findOne as jest.Mock).mockResolvedValue(session);

      await service.closeSession('session-1', 'user-1', undefined, manager as EntityManager);

      expect(manager.save).toHaveBeenCalledWith(session);
    });
  });
});
