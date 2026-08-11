import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TariffOrmEntity } from './infrastructure/orm/tariff.orm-entity';
import { ITariffRepository, TARIFF_REPOSITORY } from './ports/tariff-repository.port';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/infrastructure/orm/audit-log.orm-entity';

const MAX_TARIFFS = 3;

@Injectable()
export class TariffsService {
  constructor(
    @Inject(TARIFF_REPOSITORY)
    private readonly repo: ITariffRepository,
    private readonly auditService: AuditService,
  ) {}

  findAll(activeOnly?: boolean): Promise<TariffOrmEntity[]> {
    return this.repo.findAll(activeOnly);
  }

  async findOne(id: string): Promise<TariffOrmEntity> {
    const tariff = await this.repo.findOne(id);
    if (!tariff) throw new NotFoundException('TARIFF_NOT_FOUND');
    return tariff;
  }

  async create(dto: CreateTariffDto): Promise<TariffOrmEntity> {
    const existing = await this.repo.findAll();
    if (existing.length >= MAX_TARIFFS) {
      throw new BadRequestException('MAX_TARIFFS_REACHED');
    }

    const tariff = await this.repo.save(
      this.repo.create({
        ...dto,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      }),
    );
    void this.auditService.log({
      userId: null,
      action: AuditAction.TARIFF_CREATED,
      entityType: 'tariff',
      entityId: tariff.id,
      metadata: { name: tariff.name },
    });
    return tariff;
  }

  async update(id: string, dto: UpdateTariffDto): Promise<TariffOrmEntity> {
    const tariff = await this.findOne(id);
    const { effectiveFrom, effectiveTo, ...rest } = dto;
    if (effectiveFrom) tariff.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined)
      tariff.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    Object.assign(tariff, rest);
    const saved = await this.repo.save(tariff);
    void this.auditService.log({
      userId: null,
      action: AuditAction.TARIFF_UPDATED,
      entityType: 'tariff',
      entityId: id,
    });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const tariff = await this.findOne(id);
    await this.repo.softRemove(tariff);
  }
}
