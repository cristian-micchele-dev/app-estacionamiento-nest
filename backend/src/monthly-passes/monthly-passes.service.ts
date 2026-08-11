import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MonthlyPassOrmEntity } from './infrastructure/orm/monthly-pass.orm-entity';
import { IMonthlyPassRepository, MONTHLY_PASS_REPOSITORY } from './ports/monthly-pass-repository.port';
import { CreateMonthlyPassDto } from './dto/create-monthly-pass.dto';
import { UpdateMonthlyPassDto } from './dto/update-monthly-pass.dto';
import { PaginatedResult, PaginationDto } from '../shared/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/infrastructure/orm/audit-log.orm-entity';

@Injectable()
export class MonthlyPassesService {
  constructor(
    @Inject(MONTHLY_PASS_REPOSITORY)
    private readonly repo: IMonthlyPassRepository,
    private readonly auditService: AuditService,
  ) {}

  findAll(
    pagination: PaginationDto,
    activeOnly?: boolean,
  ): Promise<PaginatedResult<MonthlyPassOrmEntity>> {
    return this.repo.findAll(pagination, activeOnly);
  }

  async findOne(id: string): Promise<MonthlyPassOrmEntity> {
    const pass = await this.repo.findOne(id);
    if (!pass) throw new NotFoundException('MONTHLY_PASS_NOT_FOUND');
    return pass;
  }

  findActiveByVehicle(vehicleId: string): Promise<MonthlyPassOrmEntity | null> {
    return this.repo.findActiveByVehicle(vehicleId);
  }

  async create(dto: CreateMonthlyPassDto): Promise<MonthlyPassOrmEntity> {
    if (dto.validFrom >= dto.validTo)
      throw new BadRequestException('INVALID_DATE_RANGE');
    const pass = await this.repo.save(this.repo.create(dto));
    void this.auditService.log({
      userId: null,
      action: AuditAction.MONTHLY_PASS_CREATED,
      entityType: 'monthly_pass',
      entityId: pass.id,
      metadata: { vehicleId: pass.vehicleId, validFrom: pass.validFrom, validTo: pass.validTo },
    });
    return pass;
  }

  async update(
    id: string,
    dto: UpdateMonthlyPassDto,
  ): Promise<MonthlyPassOrmEntity> {
    const pass = await this.findOne(id);
    Object.assign(pass, dto);
    return this.repo.save(pass);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
