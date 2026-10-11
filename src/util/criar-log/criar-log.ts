import { BadRequestException } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';

interface ExecutorDeConsulta {
  query: (texto: string, valores: unknown[]) => Promise<unknown>;
}

export type AcaoLog = 'post' | 'delete' | 'put' | 'patch';

export interface CriarLogParams {
  organizacaoid: number;
  feitoporusuarioid: number;
  feitoem: Date;
  acao: AcaoLog;
  antes?: unknown;
  depois?: unknown;
}

/** Persiste um registro de auditoria para uma alteracao realizada no banco. */
export async function criarLog(
  {
    organizacaoid,
    feitoporusuarioid,
    feitoem,
    acao,
    antes,
    depois,
  }: CriarLogParams,
  executor: ExecutorDeConsulta = postgresPool,
): Promise<void> {
  if (!Number.isInteger(organizacaoid) || organizacaoid <= 0) {
    throw new BadRequestException(
      'A organizacao informada para o log e invalida.',
    );
  }

  if (!Number.isInteger(feitoporusuarioid) || feitoporusuarioid <= 0) {
    throw new BadRequestException('O usuario informado para o log e invalido.');
  }

  if (!(feitoem instanceof Date) || Number.isNaN(feitoem.getTime())) {
    throw new BadRequestException('A data informada para o log e invalida.');
  }

  await executor.query(
    `INSERT INTO log (
      organizacaoid,
      feitoporusuarioid,
      feitoem,
      acao,
      antes,
      depois
    ) VALUES ($1, $2, $3, $4, $5::JSONB, $6::JSONB)`,
    [
      organizacaoid,
      feitoporusuarioid,
      feitoem,
      acao.toUpperCase(),
      antes === undefined ? null : JSON.stringify(antes),
      depois === undefined ? null : JSON.stringify(depois),
    ],
  );
}
