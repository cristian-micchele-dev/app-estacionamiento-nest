import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserOrmEntity, UserRole } from './infrastructure/orm/user.orm-entity';
import { AuditService } from '../audit/audit.service';
import { USER_REPOSITORY } from './ports/user-repository.port';

const mockUser = (overrides: Partial<UserOrmEntity> = {}): UserOrmEntity =>
  ({
    id:           'user-1',
    name:         'Juan Pérez',
    email:        'juan@example.com',
    passwordHash: '$2b$10$hashed',
    role:         UserRole.CASHIER,
    isActive:     true,
    refreshToken: null,
    createdAt:    new Date(),
    updatedAt:    new Date(),
    deletedAt:    null,
    ...overrides,
  } as UserOrmEntity);

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOneById:   jest.Mock;
    findOneByEmail: jest.Mock;
    findAll:       jest.Mock;
    create:        jest.Mock;
    save:          jest.Mock;
    softDelete:    jest.Mock;
    update:        jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOneById:    jest.fn(),
      findOneByEmail: jest.fn(),
      findAll:        jest.fn().mockResolvedValue([[], 0]),
      create:         jest.fn().mockImplementation(d => d),
      save:           jest.fn().mockImplementation(u => Promise.resolve({ ...mockUser(), ...u })),
      softDelete:     jest.fn().mockResolvedValue(undefined),
      update:         jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: repo },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a user when email is not taken', async () => {
      repo.findOneByEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pw' as never);

      const result = await service.create({ name: 'Juan', email: 'juan@example.com', password: 'secret123' });

      expect(result.email).toBe('juan@example.com');
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws EMAIL_ALREADY_EXISTS when email is taken', async () => {
      repo.findOneByEmail.mockResolvedValue(mockUser());

      await expect(service.create({ name: 'Juan', email: 'juan@example.com', password: 'secret123' }))
        .rejects.toThrow(ConflictException);
    });
  });

  // ─── updateProfile ───────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates name and email when no conflict', async () => {
      repo.findOneById.mockResolvedValue(mockUser());
      repo.findOneByEmail.mockResolvedValue(null); // no email conflict

      const result = await service.updateProfile('user-1', { name: 'Carlos', email: 'carlos@example.com' });

      expect(repo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws EMAIL_ALREADY_EXISTS when new email belongs to another user', async () => {
      repo.findOneById.mockResolvedValue(mockUser());
      repo.findOneByEmail.mockResolvedValue(mockUser({ id: 'other-user', email: 'taken@example.com' }));

      await expect(service.updateProfile('user-1', { email: 'taken@example.com' }))
        .rejects.toThrow(ConflictException);
    });

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent', { name: 'X' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ─── changePassword ──────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('updates password hash when current password is correct', async () => {
      repo.findOneById.mockResolvedValue(mockUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hash' as never);

      await service.changePassword('user-1', { currentPassword: 'correct', newPassword: 'newsecret123' });

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'new_hash' }));
    });

    it('throws INVALID_CURRENT_PASSWORD when current password is wrong', async () => {
      repo.findOneById.mockResolvedValue(mockUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'new123' }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(service.changePassword('non-existent', { currentPassword: 'x', newPassword: 'y' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
