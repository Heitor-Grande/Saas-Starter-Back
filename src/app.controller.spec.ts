import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('Controller da aplicação', () => {
  let appController: AppController;

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
