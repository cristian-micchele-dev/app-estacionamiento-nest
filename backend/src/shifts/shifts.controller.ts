import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly svc: ShiftsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  findAll(@Query() pagination: PaginationDto) {
    return this.svc.findAll(pagination);
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  findActive() {
    return this.svc.findActive();
  }

  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  open(@CurrentUser() user: CurrentUserPayload, @Body() dto: OpenShiftDto) {
    return this.svc.open(user.sub, dto);
  }

  @Post(':id/close')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  close(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CloseShiftDto) {
    return this.svc.close(id, dto);
  }
}
