import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { UserOrmEntity } from '../users/infrastructure/orm/user.orm-entity';
import { IUserRepository, USER_REPOSITORY } from '../users/ports/user-repository.port';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/infrastructure/orm/audit-log.orm-entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userRepo.findOneByEmail(dto.email);

    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');
    if (!user.isActive) throw new ForbiddenException('USER_INACTIVE');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
    }).catch((err) => this.logger.error('Audit log failed (LOGIN)', err));

    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenResponseDto> {
    const user = await this.userRepo.findOneById(userId);

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) throw new ForbiddenException('ACCESS_DENIED');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: null } as Partial<UserOrmEntity>);
    this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'user',
      entityId: userId,
    }).catch((err) => this.logger.error('Audit log failed (LOGOUT)', err));
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) throw new UnauthorizedException();
    return UserResponseDto.from(user);
  }

  private async generateTokens(
    user: UserOrmEntity,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, { refreshToken: hashed } as Partial<UserOrmEntity>);
  }
}
