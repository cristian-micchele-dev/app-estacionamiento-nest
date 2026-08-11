import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSessionOrmEntity } from '../parking/infrastructure/orm/parking-session.orm-entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingSessionOrmEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
