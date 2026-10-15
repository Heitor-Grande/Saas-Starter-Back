import { Module } from '@nestjs/common';
import { CarregaPermissoesUsuarioController } from './carrega-permissoes-usuario.controller';
import { CarregaPermissoesUsuarioService } from './carrega-permissoes-usuario.service';

@Module({
  controllers: [CarregaPermissoesUsuarioController],
  providers: [CarregaPermissoesUsuarioService],
})
export class CarregaPermissoesUsuarioModule {}
