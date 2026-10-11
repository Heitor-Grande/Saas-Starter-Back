import { Module } from '@nestjs/common';
import { CadastroInicialController } from './cadastro-inicial.controller';
import { CadastroInicialService } from './cadastro-inicial.service';

@Module({
  controllers: [CadastroInicialController],
  providers: [CadastroInicialService],
})
export class CadastroInicialModule {}
