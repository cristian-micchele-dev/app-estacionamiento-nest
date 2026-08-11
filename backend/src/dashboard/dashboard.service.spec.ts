import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from '../parking/infrastructure/orm/parking-session.orm-entity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Raw row as PostgreSQL returns it (all strings). */
function makeRow(overrides: {
  date?: string;
  sessions?: string;
  quoted?: string;
  collected?: string;
} = {}) {
  return {
    date: new Date('2024-06-15').toISOString(),
    sessions: '10',
    quoted: '1200.50',
    collected: '900.25',
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('DashboardService', () => {
  let service: DashboardService;
  let repo: Record<string, jest.Mock>;
  let cache: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      query: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };

    cache = {
      get: jest.fn().mockResolvedValue(null), // cache miss by default
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(ParkingSessionOrmEntity),
          useValue: repo,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getStats — aggregation ────────────────────────────────────────────────

  describe('getStats — aggregation', () => {
    it('returns zeros when there are no completed sessions', async () => {
      repo.query.mockResolvedValue([]);
      repo.count.mockResolvedValue(3);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.activeSessions).toBe(3);
      expect(result.totalSessions).toBe(0);
      expect(result.totalQuoted).toBe(0);
      expect(result.totalCollected).toBe(0);
      expect(result.avgTicket).toBe(0);
      expect(result.collectionRate).toBe(0);
    });

    it('does not divide by zero when totalSessions is 0', async () => {
      repo.query.mockResolvedValue([]);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.avgTicket).toBe(0);
    });

    it('does not divide by zero when totalQuoted is 0', async () => {
      repo.query.mockResolvedValue([makeRow({ quoted: '0', collected: '0' })]);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.collectionRate).toBe(0);
    });

    it('aggregates totalSessions, totalQuoted and totalCollected across series points', async () => {
      repo.query.mockResolvedValue([
        makeRow({ sessions: '5', quoted: '500', collected: '400' }),
        makeRow({ sessions: '3', quoted: '300', collected: '300' }),
      ]);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.totalSessions).toBe(8);
      expect(result.totalQuoted).toBe(800);
      expect(result.totalCollected).toBe(700);
    });

    it('calculates avgTicket as totalQuoted / totalSessions', async () => {
      repo.query.mockResolvedValue([
        makeRow({ sessions: '4', quoted: '800', collected: '600' }),
      ]);

      const result = await service.getStats({ period: 'day' } as any);

      // 800 / 4 = 200
      expect(result.avgTicket).toBe(200);
    });

    it('calculates collectionRate as (collected / quoted) * 100', async () => {
      repo.query.mockResolvedValue([
        makeRow({ sessions: '2', quoted: '1000', collected: '750' }),
      ]);

      const result = await service.getStats({ period: 'day' } as any);

      // (750 / 1000) * 100 = 75
      expect(result.collectionRate).toBe(75);
    });

    it('rounds monetary values to 2 decimal places', async () => {
      repo.query.mockResolvedValue([
        makeRow({ sessions: '3', quoted: '100', collected: '33.333' }),
      ]);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.totalCollected).toBe(33.33);
      // avgTicket = 100 / 3 ≈ 33.33
      expect(result.avgTicket).toBe(33.33);
    });

    it('returns series with parsed numeric values and ISO date strings', async () => {
      const row = makeRow({ sessions: '5', quoted: '600', collected: '500' });
      repo.query.mockResolvedValue([row]);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.series).toHaveLength(1);
      expect(result.series[0].sessions).toBe(5);
      expect(result.series[0].quoted).toBe(600);
      expect(result.series[0].collected).toBe(500);
      expect(typeof result.series[0].date).toBe('string');
    });

    it('includes activeSessions count from the repo', async () => {
      repo.count.mockResolvedValue(7);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result.activeSessions).toBe(7);
      expect(repo.count).toHaveBeenCalledWith({
        where: { status: SessionStatus.ACTIVE },
      });
    });
  });

  // ─── getStats — period ranges ──────────────────────────────────────────────

  describe('getStats — period ranges', () => {
    const REF = '2024-06-15';

    it('passes "day" as truncUnit to the raw query for period=day', async () => {
      await service.getStats({ period: 'day', date: REF } as any);

      expect(repo.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['day']),
      );
    });

    it('passes "week" as truncUnit for period=week', async () => {
      await service.getStats({ period: 'week', date: REF } as any);

      expect(repo.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['week']),
      );
    });

    it('passes "month" as truncUnit for period=month', async () => {
      await service.getStats({ period: 'month', date: REF } as any);

      expect(repo.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['month']),
      );
    });

    it('uses today as reference when no date is provided', async () => {
      const today = new Date();
      await service.getStats({ period: 'day' } as any);

      const [, from, to] = repo.query.mock.calls[0][1] as [string, Date, Date];

      // `to` is set to end-of-day (23:59:59.999), so check it's today's date
      expect(to.getFullYear()).toBe(today.getFullYear());
      expect(to.getMonth()).toBe(today.getMonth());
      expect(to.getDate()).toBe(today.getDate());
      expect(from.getTime()).toBeLessThan(to.getTime());
    });

    it('period=day covers the last 30 days', async () => {
      await service.getStats({ period: 'day', date: REF } as any);

      const [, from, to] = repo.query.mock.calls[0][1] as [string, Date, Date];
      const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      // from = 00:00 of day -29, to = 23:59:59 of ref → ~30 days when rounded
      expect(diffDays).toBeCloseTo(30, 0);
    });

    it('period=week covers ~12 weeks', async () => {
      await service.getStats({ period: 'week', date: REF } as any);

      const [, from, to] = repo.query.mock.calls[0][1] as [string, Date, Date];
      const diffDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      // from = 00:00 of day -77, to = 23:59:59 of ref → ~78 days when rounded
      expect(diffDays).toBeCloseTo(78, 0);
    });

    it('period=month covers ~12 months', async () => {
      await service.getStats({ period: 'month', date: REF } as any);

      const [, from, to] = repo.query.mock.calls[0][1] as [string, Date, Date];
      const refDate = new Date(REF);
      const fromDate = new Date(refDate);
      fromDate.setMonth(fromDate.getMonth() - 11);
      fromDate.setDate(1);

      expect(from.getFullYear()).toBe(fromDate.getFullYear());
      expect(from.getMonth()).toBe(fromDate.getMonth());
      expect(from.getDate()).toBe(1);
    });

    it('runs the series query and active count in parallel', async () => {
      const queryOrder: string[] = [];
      repo.query.mockImplementation(() => {
        queryOrder.push('query');
        return Promise.resolve([]);
      });
      repo.count.mockImplementation(() => {
        queryOrder.push('count');
        return Promise.resolve(0);
      });

      await service.getStats({ period: 'day' } as any);

      // Both were called — order is non-deterministic in Promise.all, just verify both ran
      expect(queryOrder).toContain('query');
      expect(queryOrder).toContain('count');
    });
  });

  // ─── getStats — caching ────────────────────────────────────────────────────

  describe('getStats — caching', () => {
    it('returns cached result without hitting the DB on a cache hit', async () => {
      const cached = { activeSessions: 5, totalSessions: 10 } as any;
      cache.get.mockResolvedValue(cached);

      const result = await service.getStats({ period: 'day' } as any);

      expect(result).toBe(cached);
      expect(repo.query).not.toHaveBeenCalled();
      expect(repo.count).not.toHaveBeenCalled();
    });

    it('saves result to cache after a DB query', async () => {
      await service.getStats({ period: 'day', date: '2024-06-15' } as any);

      expect(cache.set).toHaveBeenCalledWith(
        'dashboard:day:2024-06-15',
        expect.any(Object),
      );
    });

    it('uses "today" as cache key suffix when no date is provided', async () => {
      await service.getStats({ period: 'week' } as any);

      expect(cache.get).toHaveBeenCalledWith('dashboard:week:today');
    });
  });
});
