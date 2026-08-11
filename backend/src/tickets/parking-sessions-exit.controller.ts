import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';
import { ParkingExitService } from '../parking/parking-exit.service';
import { TicketsService } from './tickets.service';
import { PayTicketDto } from './dto/pay-ticket.dto';

@ApiTags('Parking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CASHIER)
@Controller('parking')
export class ParkingSessionsExitController {
  constructor(
    private readonly exitSvc: ParkingExitService,
    private readonly ticketsSvc: TicketsService,
  ) {}

  @Post('sessions/:id/exit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar salida y cobrar en un solo paso' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada y ticket pagado' })
  @ApiResponse({ status: 404, description: 'SESSION_NOT_FOUND' })
  @ApiResponse({ status: 400, description: 'SESSION_NOT_ACTIVE' })
  async exit(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: PayTicketDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const ticket = await this.exitSvc.checkout(sessionId);
    const result = await this.ticketsSvc.pay(ticket.id, dto, user.sub);
    return { message: 'Salida completada exitosamente', ...result };
  }
}
