import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleOrmEntity } from './infrastructure/orm/vehicle.orm-entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleOrmRepository } from './infrastructure/orm/vehicle-orm.repository';
import { VEHICLE_REPOSITORY } from './ports/vehicle-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleOrmEntity])],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    {
      provide: VEHICLE_REPOSITORY,
      useClass: VehicleOrmRepository,
    },
  ],
  exports: [VehiclesService],
})
export class VehiclesModule {}
