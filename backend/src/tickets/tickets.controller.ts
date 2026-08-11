import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { PayTicketDto } from './dto/pay-ticket.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly svc: TicketsService) {}

  @Get()
  findAll(@Query() query: TicketQueryDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post(':id/pay')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @HttpCode(HttpStatus.OK)
  pay(
    @Param('id') id: string,
    @Body() dto: PayTicketDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.svc.pay(id, dto, user.sub);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.svc.cancel(id);
  }
}
