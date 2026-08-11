import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditAction, AuditLogOrmEntity } from './infrastructure/orm/audit-log.orm-entity';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeLog(overrides: Partial<AuditLogOrmEntity> = {}): AuditLogOrmEntity {
  return {
    id:         'log-1',
    userId:     'user-1',
    action:     AuditAction.LOGIN,
    entityType: 'users',
    entityId:   'user-1',
    metadata:   {},
    ipAddress:  '127.0.0.1',
    createdAt:  new Date('2024-01-01T10:00:00Z'),
    ...overrides,
  } as AuditLogOrmEntity;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AuditService', () => {
  let service: AuditService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      save:          jest.fn().mockImplementation((e) => Promise.resolve(e)),
      create:        jest.fn().mockImplementation((d) => d),
      findAndCount:  jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLogOrmEntity), useValue: repo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── log ─────────────────────────────────────────────────────────────────────

  describe('log', () => {
    it('creates and persists a full audit entry', async () => {
      const params = {
        userId:     'user-1',
        action:     AuditAction.LOGIN,
        entityType: 'users',
        entityId:   'user-1',
        metadata:   { browser: 'Chrome' },
        ipAddress:  '192.168.1.1',
      };
      const entry = makeLog(params);
      repo.create.mockReturnValue(entry);
      repo.save.mockResolvedValue(entry);

      const result = await service.log(params);

      expect(repo.create).toHaveBeenCalledWith(params);
      expect(repo.save).toHaveBeenCalledWith(entry);
      expect(result).toEqual(entry);
    });

    it('logs an entry with null userId (anonymous action)', async () => {
      const params = {
        userId:     null,
        action:     AuditAction.VEHICLE_ENTRY,
        entityType: 'parking_sessions',
        entityId:   'session-1',
      };
      const entry = makeLog({ userId: null, ipAddress: null, metadata: null });
      repo.create.mockReturnValue(entry);
      repo.save.mockResolvedValue(entry);

      await service.log(params);

      expect(repo.create).toHaveBeenCalledWith(params);
    });

    it('returns the persisted audit log', async () => {
      const entry = makeLog({ action: AuditAction.SHIFT_OPENED });
      repo.create.mockReturnValue(entry);
      repo.save.mockResolvedValue(entry);

      const result = await service.log({
        userId:     'user-1',
        action:     AuditAction.SHIFT_OPENED,
        entityType: 'shifts',
        entityId:   'shift-1',
      });

      expect(result.action).toBe(AuditAction.SHIFT_OPENED);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated results with the correct structure', async () => {
      const logs = [makeLog(), makeLog({ id: 'log-2' })];
      repo.findAndCount.mockResolvedValue([logs, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies skip=0 and take=10 for page 1 with limit 10', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('applies correct skip=10 for page 2 with limit 10', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 2, limit: 10 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('orders results by createdAt DESC', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } }),
      );
    });

    it('returns empty data when no logs exist', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('calculates totalPages correctly for partial last page', async () => {
      const logs = Array.from({ length: 5 }, (_, i) => makeLog({ id: `log-${i}` }));
      repo.findAndCount.mockResolvedValue([logs, 25]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3);
    });
  });
});
