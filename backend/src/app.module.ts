import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import appConfig from './config/app.config';
import { loggerConfig } from './config/logger.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { ParkingModule } from './parking/parking.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { ShiftsModule } from './shifts/shifts.module';
import { MonthlyPassesModule } from './monthly-passes/monthly-passes.module';
import { AuditModule } from './audit/audit.module';
import { SpacesModule } from './spaces/spaces.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 200 }],
    }),
    CacheModule.register({ isGlobal: true, ttl: 45_000, max: 100 }),
    WinstonModule.forRoot(loggerConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions =>
        config.get<TypeOrmModuleOptions>('database')!,
    }),
    AuthModule,
    UsersModule,
    VehiclesModule,
    TariffsModule,
    ParkingModule,
    TicketsModule,
    PaymentsModule,
    ShiftsModule,
    MonthlyPassesModule,
    SpacesModule,
    AuditModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
