import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';
import { UserRole } from '../users/infrastructure/orm/user.orm-entity';
import { ChatService, InsightKey } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('insights/:key')
  @ApiOperation({ summary: 'Get a named parking insight' })
  insight(@Param('key') key: InsightKey) {
    return this.chatService.insight(key).then((answer) => ({ answer }));
  }
}
