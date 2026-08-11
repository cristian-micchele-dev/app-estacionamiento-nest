import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns status ok', () => {
      expect(controller.health().status).toBe('ok');
    });

    it('returns a valid ISO timestamp', () => {
      const { timestamp } = controller.health();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('returns a non-negative uptime', () => {
      expect(controller.health().uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
