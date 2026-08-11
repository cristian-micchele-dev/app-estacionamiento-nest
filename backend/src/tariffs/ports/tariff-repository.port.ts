import { TariffOrmEntity } from '../infrastructure/orm/tariff.orm-entity';

export const TARIFF_REPOSITORY = Symbol('ITariffRepository');

export interface ITariffRepository {
  findAll(activeOnly?: boolean): Promise<TariffOrmEntity[]>;
  findOne(id: string): Promise<TariffOrmEntity | null>;
  save(tariff: Partial<TariffOrmEntity>): Promise<TariffOrmEntity>;
  create(data: Partial<TariffOrmEntity>): TariffOrmEntity;
  softRemove(tariff: TariffOrmEntity): Promise<void>;
}
