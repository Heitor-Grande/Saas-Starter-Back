import { Module } from '@nestjs/common';
import { ConfiguracaoGlobalController } from './configuracao-global.controller';
import { ConfiguracaoGlobalService } from './configuracao-global.service';

@Module({
  controllers: [ConfiguracaoGlobalController],
  providers: [ConfiguracaoGlobalService],
})
export class ConfiguracaoGlobalModule {}
