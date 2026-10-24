import type { Pool, PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';

type ExecutorDeTransacao = Pick<Pool, 'connect'>;

/**
 * Executa uma operação usando uma transação PostgreSQL e sempre libera a conexão.
 * @param operacao Função que recebe o cliente transacional e produz o resultado.
 * @param executor Pool usado para obter a conexão; por padrão utiliza o pool da aplicação.
 * @returns O resultado produzido pela operação após a confirmação da transação.
 */
export async function executarEmTransacao<T>(
  operacao: (client: PoolClient) => Promise<T>,
  executor: ExecutorDeTransacao = postgresPool,
): Promise<T> {
  const client = await executor.connect();

  try {
    await client.query('BEGIN');
    const resultado = await operacao(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
