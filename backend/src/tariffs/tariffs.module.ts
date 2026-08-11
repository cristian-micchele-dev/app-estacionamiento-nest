import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TariffOrmEntity } from './infrastructure/orm/tariff.orm-entity';
import { TariffsService } from './tariffs.service';
import { TariffsController } from './tariffs.controller';
import { TariffOrmRepository } from './infrastructure/orm/tariff-orm.repository';
import { TARIFF_REPOSITORY } from './ports/tariff-repository.port';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([TariffOrmEntity]), AuditModule],
  controllers: [TariffsController],
  providers: [
    TariffsService,
    { provide: TARIFF_REPOSITORY, useClass: TariffOrmRepository },
  ],
  exports: [TariffsService],
})
export class TariffsModule {}
