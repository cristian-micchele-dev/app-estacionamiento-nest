import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../shared/decorators/current-user.decorator';
import { ParkingService } from './parking.service';
import { ParkingExitService } from './parking-exit.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ParkingQueryDto } from './dto/parking-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
@Controller('parking')
export class ParkingController {
  constructor(
    private readonly svc: ParkingService,
    private readonly exitSvc: ParkingExitService,
  ) {}

  @Get('stats')
  getStats() {
    return this.svc.getStats();
  }

  @Get('sessions')
  findAll(@Query() query: ParkingQueryDto) {
    return this.svc.findAll(query, query.status);
  }

  @Get('sessions/by-ticket/:ticketNumber')
  findByTicketNumber(@Param('ticketNumber') ticketNumber: string) {
    return this.svc.findByTicketNumber(ticketNumber);
  }

  @Get('sessions/:id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post('entry')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  createEntry(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.createEntry(dto, user.sub);
  }

  @Get('sessions/:id/preview-cost')
  previewCost(@Param('id') id: string) {
    return this.exitSvc.previewCost(id);
  }

  @Post('sessions/:id/checkout')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  checkout(@Param('id') id: string) {
    return this.exitSvc.checkout(id);
  }
}
