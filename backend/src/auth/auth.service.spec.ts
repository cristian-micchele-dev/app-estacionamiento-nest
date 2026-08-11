import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { USER_REPOSITORY } from '../users/ports/user-repository.port';
import { UserOrmEntity, UserRole } from '../users/infrastructure/orm/user.orm-entity';
import { AuditService } from '../audit/audit.service';

const mockUser: Partial<UserOrmEntity> = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  role: UserRole.CASHIER,
  isActive: true,
  refreshToken: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findOneByEmail: jest.Mock; findOneById: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOneByEmail: jest.fn(),
      findOneById:    jest.fn(),
      update:         jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: JwtService,      useValue: { signAsync: jest.fn().mockResolvedValue('mock-token') } },
        { provide: ConfigService,   useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        { provide: AuditService,    useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens and user when credentials are valid', async () => {
      userRepo.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await service.login({ email: 'test@example.com', password: 'correct' });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user).toMatchObject({ id: 'user-1', email: 'test@example.com' });
    });

    it('throws INVALID_CREDENTIALS when user is not found', async () => {
      userRepo.findOneByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'nobody@example.com', password: 'any' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws USER_INACTIVE when user account is disabled', async () => {
      userRepo.findOneByEmail.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login({ email: 'test@example.com', password: 'any' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws INVALID_CREDENTIALS when password does not match', async () => {
      userRepo.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refreshTokens ───────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('returns new tokens when refresh token is valid', async () => {
      userRepo.findOneById.mockResolvedValue({ ...mockUser, refreshToken: 'hashed_refresh' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await service.refreshTokens('user-1', 'valid_refresh');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('throws ACCESS_DENIED when user has no stored refresh token', async () => {
      userRepo.findOneById.mockResolvedValue({ ...mockUser, refreshToken: null });

      await expect(service.refreshTokens('user-1', 'any_token'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws ACCESS_DENIED when refresh token does not match', async () => {
      userRepo.findOneById.mockResolvedValue({ ...mockUser, refreshToken: 'hashed' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.refreshTokens('user-1', 'wrong_token'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('nullifies the stored refresh token', async () => {
      await service.logout('user-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { refreshToken: null });
    });
  });
});
