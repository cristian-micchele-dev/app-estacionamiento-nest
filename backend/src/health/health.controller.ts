import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check — usado por plataformas de deployment' })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }

    return {
      status: 'ok',
      db: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
