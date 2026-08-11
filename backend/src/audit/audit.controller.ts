import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { AuditService } from './audit.service';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
@Controller('audit')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.svc.findAll(pagination);
  }
}
