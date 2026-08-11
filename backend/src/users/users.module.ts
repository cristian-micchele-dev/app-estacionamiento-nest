import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/orm/user.orm-entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserOrmRepository } from './infrastructure/orm/user-orm.repository';
import { USER_REPOSITORY } from './ports/user-repository.port';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity]), AuditModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: UserOrmRepository },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
