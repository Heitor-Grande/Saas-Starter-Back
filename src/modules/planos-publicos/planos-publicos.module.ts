import { Module } from '@nestjs/common';
import { PlanosPublicosController } from './planos-publicos.controller';
import { PlanosPublicosService } from './planos-publicos.service';

@Module({
  controllers: [PlanosPublicosController],
  providers: [PlanosPublicosService],
})
export class PlanosPublicosModule {}
