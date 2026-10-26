import type { PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';

export type ResultadoConsultaMock = {
  rows?: unknown[];
  rowCount?: number;
};

/** Simula consultas sequenciais usando um array de linhas para cada consulta. */
export function mockConsultas(
  linhasPorConsulta: unknown[][],
): jest.SpiedFunction<typeof postgresPool.query> {
  const query = jest.spyOn(postgresPool, 'query');

  for (const rows of linhasPorConsulta) {
    query.mockResolvedValueOnce({ rows } as never);
  }

  return query;
}

/** Simula uma transação com respostas definidas pela consulta SQL executada. */
export function mockClienteTransacional(
  resolver: (sql: string, valores?: unknown[]) => ResultadoConsultaMock,
): { query: jest.Mock; release: jest.Mock } {
  const query = jest.fn((sql: string, valores?: unknown[]) =>
    Promise.resolve({ rows: [], rowCount: 0, ...resolver(sql, valores) }),
  );
  const release = jest.fn();

  const connect = jest.spyOn(
    postgresPool,
    'connect',
  ) as unknown as jest.MockedFunction<() => Promise<PoolClient>>;
  connect.mockResolvedValue({ query, release } as unknown as PoolClient);

  return { query, release };
}

/** Simula uma transação com uma lista ordenada de respostas ou erros. */
export function mockTransacaoSequencial(
  respostas: Array<ResultadoConsultaMock | Error>,
): { query: jest.Mock; release: jest.Mock } {
  const query = jest.fn();

  for (const resposta of respostas) {
    if (resposta instanceof Error) query.mockRejectedValueOnce(resposta);
    else query.mockResolvedValueOnce(resposta);
  }

  const release = jest.fn();
  const connect = jest.spyOn(
    postgresPool,
    'connect',
  ) as unknown as jest.MockedFunction<() => Promise<PoolClient>>;
  connect.mockResolvedValue({ query, release } as unknown as PoolClient);

  return { query, release };
}
