import { Injectable } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { LogDto } from './dto/log.dto';

@Injectable()
export class LogService {
  /**
   * Consulta todo o histórico de auditoria com os nomes relacionados.
   * @returns Os registros de log ordenados do mais recente para o mais antigo.
   */
  async findAll(): Promise<LogDto[]> {
    const result = await postgresPool.query<LogDto>(
      `SELECT
        log.id,
        log.organizacaoid,
        organizacoes.nome AS organizacaonome,
        log.feitoporusuarioid,
        usuarios.nome AS usuarionome,
        usuarios.email AS usuarioemail,
        perfis.nome AS perfil,
        log.feitoem,
        log.acao,
        log.antes,
        log.depois
      FROM log
      INNER JOIN organizacoes ON organizacoes.id = log.organizacaoid
      INNER JOIN usuarios ON usuarios.id = log.feitoporusuarioid
      INNER JOIN perfis ON perfis.id = usuarios.perfilid
      ORDER BY log.feitoem DESC, log.id DESC`,
    );

    return result.rows;
  }
}
