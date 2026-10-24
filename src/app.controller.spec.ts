import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import 'dotenv/config';

describe('Controller da aplicação', () => {
  let appController: AppController;

  if (!process.env.RATE_LIMIT_WINDOW_MS || !process.env.RATE_LIMIT_MAX) {
    throw new Error(
      'As variáveis de ambiente RATE_LIMIT_WINDOW_MS e RATE_LIMIT_MAX devem ser definidas no arquivo .env',
    );
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('rota raiz', () => {
    it('deve retornar objeto de boas vindas', () => {
      expect(appController.getHello()).toBeInstanceOf(Object);
    });
  });
});
