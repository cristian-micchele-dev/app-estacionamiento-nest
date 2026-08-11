import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';
import { MonthlyPassesService } from './monthly-passes.service';
import { CreateMonthlyPassDto } from './dto/create-monthly-pass.dto';
import { UpdateMonthlyPassDto } from './dto/update-monthly-pass.dto';
import { MonthlyPassQueryDto } from './dto/monthly-pass-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
@Controller('monthly-passes')
export class MonthlyPassesController {
  constructor(private readonly svc: MonthlyPassesService) {}

  @Get()
  findAll(@Query() query: MonthlyPassQueryDto) {
    return this.svc.findAll(query, query.active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  create(@Body() dto: CreateMonthlyPassDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  update(@Param('id') id: string, @Body() dto: UpdateMonthlyPassDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
