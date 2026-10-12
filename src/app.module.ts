import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthMiddleware } from './middleware/jwt-auth/jwt-auth.middleware';
import { CadastroInicialModule } from './modules/cadastro-inicial/cadastro-inicial.module';
import { LoginModule } from './modules/login/login.module';
import { PerfisModule } from './modules/perfis/perfis.module';
import { PermissoesModule } from './modules/permissoes/permissoes.module';

@Module({
  imports: [CadastroInicialModule, LoginModule, PerfisModule, PermissoesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  /**
   * Registra a validação JWT para proteger todas as rotas da aplicação.
   * @param consumer Configurador de middlewares fornecido pelo NestJS.
   * @returns Não retorna conteúdo; apenas configura o middleware.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(JwtAuthMiddleware)
      .exclude(
        { path: 'cadastro-inicial/create', method: RequestMethod.POST },
        { path: 'login', method: RequestMethod.POST },
        { path: '/', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
