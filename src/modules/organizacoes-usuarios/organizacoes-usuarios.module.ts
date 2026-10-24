import { Module } from '@nestjs/common';
import { OrganizacoesUsuariosController } from './organizacoes-usuarios.controller';
import { OrganizacoesUsuariosService } from './organizacoes-usuarios.service';

@Module({
  controllers: [OrganizacoesUsuariosController],
  providers: [OrganizacoesUsuariosService],
})
export class OrganizacoesUsuariosModule {}
