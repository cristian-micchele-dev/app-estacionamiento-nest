import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSessionOrmEntity } from './infrastructure/orm/parking-session.orm-entity';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { MonthlyPassesModule } from '../monthly-passes/monthly-passes.module';
import { SpacesModule } from '../spaces/spaces.module';
import { AuditModule } from '../audit/audit.module';
import { ParkingService } from './parking.service';
import { ParkingExitService } from './parking-exit.service';
import { ParkingController } from './parking.controller';
import { ParkingEventsService } from './parking-events.service';
import { ParkingEventsController } from './parking-events.controller';
import { SessionOrmRepository } from './infrastructure/orm/session-orm.repository';
import { SESSION_REPOSITORY } from './ports/session-repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParkingSessionOrmEntity]),
    VehiclesModule,
    TariffsModule,
    MonthlyPassesModule,
    SpacesModule,
    AuditModule,
  ],
  controllers: [ParkingController, ParkingEventsController],
  providers: [
    ParkingService,
    ParkingExitService,
    ParkingEventsService,
    { provide: SESSION_REPOSITORY, useClass: SessionOrmRepository },
  ],
  exports: [ParkingService, ParkingExitService, ParkingEventsService],
})
export class ParkingModule {}
