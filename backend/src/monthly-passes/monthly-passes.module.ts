import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyPassOrmEntity } from './infrastructure/orm/monthly-pass.orm-entity';
import { MonthlyPassesService } from './monthly-passes.service';
import { MonthlyPassesController } from './monthly-passes.controller';
import { MonthlyPassOrmRepository } from './infrastructure/orm/monthly-pass-orm.repository';
import { MONTHLY_PASS_REPOSITORY } from './ports/monthly-pass-repository.port';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([MonthlyPassOrmEntity]), AuditModule],
  controllers: [MonthlyPassesController],
  providers: [
    MonthlyPassesService,
    { provide: MONTHLY_PASS_REPOSITORY, useClass: MonthlyPassOrmRepository },
  ],
  exports: [MonthlyPassesService],
})
export class MonthlyPassesModule {}
