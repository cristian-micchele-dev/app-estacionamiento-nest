import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserOrmEntity, UserRole } from './infrastructure/orm/user.orm-entity';
import { IUserRepository, USER_REPOSITORY } from './ports/user-repository.port';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  paginate,
  PaginatedResult,
  PaginationDto,
} from '../shared/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/infrastructure/orm/audit-log.orm-entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, actorId: string | null = null): Promise<UserResponseDto> {
    const existing = await this.userRepo.findOneByEmail(dto.email, true);

    if (existing) throw new ConflictException('EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.CASHIER,
    } as Partial<UserOrmEntity>);

    const saved = await this.userRepo.save(user);
    this.auditService.log({
      userId: actorId,
      action: AuditAction.USER_CREATED,
      entityType: 'user',
      entityId: saved.id,
      metadata: { email: saved.email, role: saved.role },
    }).catch((err) => this.logger.error('Audit log failed (USER_CREATED)', err));
    return this.toResponse(saved);
  }

  async findAll(
    pagination: PaginationDto,
    filters?: { role?: UserRole; isActive?: boolean },
  ): Promise<PaginatedResult<UserResponseDto>> {
    const [users, total] = await this.userRepo.findAll(pagination, filters);
    return paginate(users.map((u) => this.toResponse(u)), total, pagination.page, pagination.limit);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOneById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string | null = null): Promise<UserResponseDto> {
    const user = await this.userRepo.findOneById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    if (dto.email && dto.email !== user.email) {
      const conflict = await this.userRepo.findOneByEmail(dto.email, true);
      if (conflict) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.userRepo.save(user);
    this.auditService.log({
      userId: actorId,
      action: AuditAction.USER_UPDATED,
      entityType: 'user',
      entityId: saved.id,
    }).catch((err) => this.logger.error('Audit log failed (USER_UPDATED)', err));
    return this.toResponse(saved);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    if (dto.email && dto.email !== user.email) {
      const conflict = await this.userRepo.findOneByEmail(dto.email, true);
      if (conflict) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    if (dto.name  !== undefined) user.name  = dto.name;
    if (dto.email !== undefined) user.email = dto.email;

    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOneById(userId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('INVALID_CURRENT_PASSWORD');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
  }

  async remove(id: string, actorId: string | null = null): Promise<void> {
    const user = await this.userRepo.findOneById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    await this.userRepo.softDelete(id);
    this.auditService.log({
      userId: actorId,
      action: AuditAction.USER_DELETED,
      entityType: 'user',
      entityId: id,
    }).catch((err) => this.logger.error('Audit log failed (USER_DELETED)', err));
  }

  private toResponse(user: UserOrmEntity): UserResponseDto {
    return UserResponseDto.from(user);
  }
}
