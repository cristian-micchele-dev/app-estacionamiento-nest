import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../src/auth/strategies/jwt-refresh.strategy';
import { USER_REPOSITORY } from '../src/users/ports/user-repository.port';
import { AuditService } from '../src/audit/audit.service';
import { UserRole } from '../src/users/infrastructure/orm/user.orm-entity';
import jwtConfig from '../src/config/jwt.config';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EMAIL    = 'admin@parking.com';
const PASSWORD = 'correct-password';
let passwordHash: string;

const mockUser = () => ({
  id: 'user-1',
  name: 'Admin User',
  email: EMAIL,
  passwordHash,
  role: UserRole.ADMIN,
  isActive: true,
  refreshToken: null,
});

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;
  let userRepo: Record<string, jest.Mock>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-jwt-secret-minimum-32chars!';
    process.env.JWT_REFRESH_SECRET = 'e2e-test-refresh-secret-32chars!!';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    passwordHash = await bcrypt.hash(PASSWORD, 10);

    userRepo = {
      findOneByEmail: jest.fn(),
      findOneById:    jest.fn(),
      save:           jest.fn().mockImplementation((d: unknown) => Promise.resolve(d)),
      update:         jest.fn().mockResolvedValue(undefined),
      create:         jest.fn().mockImplementation((d: unknown) => d),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
        PassportModule,
        JwtModule.register({}),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtRefreshStrategy,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    api = request(app.getHttpServer());
  });

  afterAll(() => app.close());

  afterEach(() => jest.clearAllMocks());

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Performs a login and returns the token pair from the response body. */
  async function login(password = PASSWORD) {
    userRepo.findOneByEmail.mockResolvedValue(mockUser());
    const res = await api.post('/api/v1/auth/login').send({ email: EMAIL, password });
    return res.body as { accessToken: string; refreshToken: string };
  }

  /**
   * Patches userRepo.update to capture the bcrypt hash stored after login/refresh.
   * Returns a getter so the caller can read the latest captured value.
   */
  function captureStoredHash(): () => string | null {
    let hash: string | null = null;
    userRepo.update.mockImplementation((_id: string, data: Record<string, unknown>) => {
      if ('refreshToken' in data) hash = data.refreshToken as string;
      return Promise.resolve(undefined);
    });
    return () => hash;
  }

  // ─── POST /auth/login ─────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with token pair and user info on valid credentials', async () => {
      userRepo.findOneByEmail.mockResolvedValue(mockUser());

      const res = await api
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(EMAIL);
      expect(res.body.user.role).toBe(UserRole.ADMIN);
    });

    it('returns 401 when the password is wrong', async () => {
      await api
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: 'wrong-password' })
        .expect(401);
    });

    it('returns 401 when the user does not exist', async () => {
      userRepo.findOneByEmail.mockResolvedValue(null);

      await api
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@parking.com', password: PASSWORD })
        .expect(401);
    });

    it('returns 403 when the user account is inactive', async () => {
      userRepo.findOneByEmail.mockResolvedValue({ ...mockUser(), isActive: false });

      await api
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(403);
    });

    it('returns 400 when email is missing', async () => {
      await api.post('/api/v1/auth/login').send({ password: PASSWORD }).expect(400);
    });

    it('returns 400 when password is missing', async () => {
      await api.post('/api/v1/auth/login').send({ email: EMAIL }).expect(400);
    });

    it('returns 400 when email format is invalid', async () => {
      await api.post('/api/v1/auth/login').send({ email: 'not-an-email', password: PASSWORD }).expect(400);
    });
  });

  // ─── POST /auth/logout ────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('returns 401 when no token is provided', async () => {
      await api.post('/api/v1/auth/logout').expect(401);
    });

    it('returns 204 and nullifies the stored refresh token', async () => {
      const { accessToken } = await login();

      await api
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      expect(userRepo.update).toHaveBeenLastCalledWith('user-1', { refreshToken: null });
    });
  });

  // ─── POST /auth/refresh ───────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 401 when no token is provided', async () => {
      await api.post('/api/v1/auth/refresh').expect(401);
    });

    it('returns a new token pair when the refresh token is valid', async () => {
      const getHash = captureStoredHash();
      const { refreshToken } = await login();

      userRepo.findOneById.mockResolvedValue({ ...mockUser(), refreshToken: getHash() });

      const res = await api
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(EMAIL);
    });

    it('returns 403 when the stored hash does not match the provided token', async () => {
      const { refreshToken } = await login();
      const wrongHash = await bcrypt.hash('completely-different-token', 10);
      userRepo.findOneById.mockResolvedValue({ ...mockUser(), refreshToken: wrongHash });

      await api
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(403);
    });

    it('returns 403 when no refresh token is stored (user already logged out)', async () => {
      const { refreshToken } = await login();
      userRepo.findOneById.mockResolvedValue({ ...mockUser(), refreshToken: null });

      await api
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(403);
    });
  });

  // ─── GET /auth/me ─────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 when no token is provided', async () => {
      await api.get('/api/v1/auth/me').expect(401);
    });

    it('returns the authenticated user without sensitive fields', async () => {
      const { accessToken } = await login();
      userRepo.findOneById.mockResolvedValue(mockUser());

      const res = await api
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe('user-1');
      expect(res.body.email).toBe(EMAIL);
      expect(res.body.role).toBe(UserRole.ADMIN);
      expect(res.body.passwordHash).toBeUndefined();
    });
  });

  // ─── Full auth flow ───────────────────────────────────────────────────────

  describe('Full auth flow: login → /me → refresh → logout → refresh fails', () => {
    it('completes without errors and invalidates the session on logout', async () => {
      const getHash = captureStoredHash();

      // 1. Login
      const { accessToken, refreshToken } = await login();

      // 2. /me
      userRepo.findOneById.mockResolvedValue(mockUser());
      await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);

      // 3. Refresh
      userRepo.findOneById.mockResolvedValue({ ...mockUser(), refreshToken: getHash() });
      const refreshRes = await api
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      // 4. Logout
      userRepo.findOneById.mockResolvedValue(mockUser());
      await api
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
        .expect(204);

      // 5. Refresh after logout must fail
      userRepo.findOneById.mockResolvedValue({ ...mockUser(), refreshToken: null });
      await api
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshRes.body.refreshToken}`)
        .expect(403);
    });
  });
});
