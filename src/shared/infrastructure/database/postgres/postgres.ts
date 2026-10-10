import 'dotenv/config';
import { Pool } from 'pg';

export const postgresPool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

/**
 * Confirma a conexão com o PostgreSQL antes de iniciar a aplicação.
 * @returns Uma Promise concluída quando a conexão for estabelecida com sucesso.
 */
export async function connectDatabase(): Promise<void> {
  const client = await postgresPool.connect();
  client.release();
}
