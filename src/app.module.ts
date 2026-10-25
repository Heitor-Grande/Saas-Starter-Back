import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PermissaoGuard } from './guards/permissao/permissao.guard';
import { JwtAuthMiddleware } from './middleware/jwt-auth/jwt-auth.middleware';
import { CadastroInicialModule } from './modules/cadastro-inicial/cadastro-inicial.module';
import { CarregaPermissoesUsuarioModule } from './modules/carrega-permissoes-usuario/carrega-permissoes-usuario.module';
import { LoginModule } from './modules/login/login.module';
import { LogModule } from './modules/log/log.module';
import { OrganizacoesUsuariosModule } from './modules/organizacoes-usuarios/organizacoes-usuarios.module';
import { PerfisModule } from './modules/perfis/perfis.module';
import { PermissoesModule } from './modules/permissoes/permissoes.module';
import { PlanosModule } from './modules/planos/planos.module';

if (!process.env.RATE_LIMIT_WINDOW_MS || !process.env.RATE_LIMIT_MAX) {
  throw new Error(
    'As variáveis de ambiente RATE_LIMIT_WINDOW_MS e RATE_LIMIT_MAX devem ser definidas no arquivo .env',
  );
}

const RATE_LIMIT_TTL_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX);

@Module({
  imports: [
    //rate limit usando ThrottlerModule do NestJS.
    ThrottlerModule.forRoot([
      {
        ttl: RATE_LIMIT_TTL_MS,
        limit: RATE_LIMIT_MAX_REQUESTS,
      },
    ]),
    //importando os módulos de funcionalidades da aplicação.
    CadastroInicialModule,
    CarregaPermissoesUsuarioModule,
    LoginModule,
    LogModule,
    OrganizacoesUsuariosModule,
    PerfisModule,
    PermissoesModule,
    PlanosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissaoGuard,
    },
  ],
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
