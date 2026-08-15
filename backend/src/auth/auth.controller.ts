import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser, CurrentUserPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'INVALID_CREDENTIALS' })
  @ApiResponse({ status: 403, description: 'USER_INACTIVE' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  refresh(
    @CurrentUser() user: CurrentUserPayload & { refreshToken: string },
  ): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(user.sub, user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  logout(@CurrentUser() user: CurrentUserPayload): Promise<void> {
    return this.authService.logout(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.sub);
  }
}
