import { Module } from '@nestjs/common';
import { MeuUsuarioController } from './meu-usuario.controller';
import { MeuUsuarioService } from './meu-usuario.service';

@Module({
  controllers: [MeuUsuarioController],
  providers: [MeuUsuarioService],
})
export class MeuUsuarioModule {}
