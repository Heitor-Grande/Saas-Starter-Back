import { Injectable } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { PlanoPublicoDto } from './dto/plano-publico.dto';

@Injectable()
export class PlanosPublicosService {
  /** Lista somente os dados de planos necessários para o cadastro público. */
  async findAll(): Promise<PlanoPublicoDto[]> {
    const result = await postgresPool.query<PlanoPublicoDto>(
      `SELECT id, nome, valor
       FROM planos
       ORDER BY valor, nome`,
    );
    return result.rows;
  }
}
