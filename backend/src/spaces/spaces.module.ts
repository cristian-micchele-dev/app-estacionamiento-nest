import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSpaceOrmEntity } from './infrastructure/orm/parking-space.orm-entity';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { SpaceOrmRepository } from './infrastructure/orm/space-orm.repository';
import { SPACE_REPOSITORY } from './ports/space-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingSpaceOrmEntity])],
  controllers: [SpacesController],
  providers: [
    SpacesService,
    { provide: SPACE_REPOSITORY, useClass: SpaceOrmRepository },
  ],
  exports: [SpacesService],
})
export class SpacesModule {}
