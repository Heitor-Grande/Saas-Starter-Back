import 'dotenv/config';
import { Pool } from 'pg';

if (
  process.env.DATABASE_HOST === undefined ||
  process.env.DATABASE_PORT === undefined ||
  process.env.DATABASE_USER === undefined ||
  process.env.DATABASE_PASSWORD === undefined ||
  process.env.DATABASE_NAME === undefined
) {
  throw new Error(
    `As variáveis de ambiente DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD e DATABASE_NAME devem estar definidas.`,
  );
}

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
