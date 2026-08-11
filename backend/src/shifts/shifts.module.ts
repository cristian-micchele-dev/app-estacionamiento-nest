import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftOrmEntity } from './infrastructure/orm/shift.orm-entity';
import { PaymentsModule } from '../payments/payments.module';
import { AuditModule } from '../audit/audit.module';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftOrmRepository } from './infrastructure/orm/shift-orm.repository';
import { SHIFT_REPOSITORY } from './ports/shift-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftOrmEntity]), PaymentsModule, AuditModule],
  controllers: [ShiftsController],
  providers: [
    ShiftsService,
    { provide: SHIFT_REPOSITORY, useClass: ShiftOrmRepository },
  ],
  exports: [ShiftsService],
})
export class ShiftsModule {}
