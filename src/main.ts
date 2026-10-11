import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectDatabase } from './shared/infrastructure/database/postgres/postgres';

/**
 * Inicia as conexões necessárias e disponibiliza a API para receber requisições.
 * @returns Uma Promise concluída quando a aplicação for iniciada.
 */
async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
