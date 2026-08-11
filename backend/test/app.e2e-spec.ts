import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /api/v1/health → 200 with status ok', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(typeof res.body.uptime).toBe('number');
        expect(res.body.uptime).toBeGreaterThanOrEqual(0);
        expect(res.body.timestamp).toBeDefined();
        expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
      });
  });
});
