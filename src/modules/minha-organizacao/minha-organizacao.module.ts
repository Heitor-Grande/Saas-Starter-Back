import { Module } from '@nestjs/common';
import { MinhaOrganizacaoController } from './minha-organizacao.controller';
import { MinhaOrganizacaoService } from './minha-organizacao.service';

@Module({
  controllers: [MinhaOrganizacaoController],
  providers: [MinhaOrganizacaoService],
})
export class MinhaOrganizacaoModule {}
