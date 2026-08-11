import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TariffOrmEntity } from './tariff.orm-entity';
import { ITariffRepository } from '../../ports/tariff-repository.port';

@Injectable()
export class TariffOrmRepository implements ITariffRepository {
  constructor(
    @InjectRepository(TariffOrmEntity)
    private readonly repo: Repository<TariffOrmEntity>,
  ) {}

  findAll(activeOnly?: boolean): Promise<TariffOrmEntity[]> {
    return this.repo.find({
      where: activeOnly ? { isActive: true } : undefined,
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: string): Promise<TariffOrmEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(tariff: Partial<TariffOrmEntity>): Promise<TariffOrmEntity> {
    return this.repo.save(tariff as TariffOrmEntity);
  }

  create(data: Partial<TariffOrmEntity>): TariffOrmEntity {
    return this.repo.create(data);
  }

  async softRemove(tariff: TariffOrmEntity): Promise<void> {
    await this.repo.softRemove(tariff);
  }
}
