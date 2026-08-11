import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from './infrastructure/orm/user.orm-entity';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserQueryDto } from './dto/user-query.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'EMAIL_ALREADY_EXISTS' })
  create(
    @CurrentUser() actor: CurrentUserPayload,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(dto, actor.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query, {
      role: query.role,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  @Patch('me')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch('me/password')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CASHIER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'INVALID_CURRENT_PASSWORD' })
  changeMyPassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.usersService.changePassword(user.sub, dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'EMAIL_ALREADY_EXISTS' })
  update(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, actor.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  remove(
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.usersService.remove(id, actor.sub);
  }
}
