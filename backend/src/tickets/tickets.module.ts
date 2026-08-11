import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketOrmEntity } from './infrastructure/orm/ticket.orm-entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { ParkingSessionsExitController } from './parking-sessions-exit.controller';
import { ParkingModule } from '../parking/parking.module';
import { TicketOrmRepository } from './infrastructure/orm/ticket-orm.repository';
import { TICKET_REPOSITORY } from './ports/ticket-repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketOrmEntity]),
    ParkingModule,
  ],
  controllers: [TicketsController, ParkingSessionsExitController],
  providers: [
    TicketsService,
    { provide: TICKET_REPOSITORY, useClass: TicketOrmRepository },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
