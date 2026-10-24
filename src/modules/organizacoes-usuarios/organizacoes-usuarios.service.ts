import { Injectable } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { OrganizacaoComUsuariosDto } from './dto/organizacao-usuarios.dto';

type OrganizacaoUsuarioRow = {
  organizacaoid: number;
  organizacaonome: string;
  plano: string;
  usuarioid: number | null;
  usuarionome: string | null;
  perfil: string | null;
  usuarioativo: boolean | null;
};

@Injectable()
export class OrganizacoesUsuariosService {
  /**
   * Consulta as organizações e agrupa seus usuários para exibição em árvore.
   * @returns As organizações cadastradas, com plano e respectivos usuários.
   */
  async findAll(): Promise<OrganizacaoComUsuariosDto[]> {
    const result = await postgresPool.query<OrganizacaoUsuarioRow>(
      `SELECT
        organizacoes.id AS organizacaoid,
        organizacoes.nome AS organizacaonome,
        planos.nome AS plano,
        usuarios.id AS usuarioid,
        usuarios.nome AS usuarionome,
        perfis.nome AS perfil,
        usuarios.ativo AS usuarioativo
      FROM organizacoes
      INNER JOIN planos ON planos.id = organizacoes.planoid
      LEFT JOIN usuarios ON usuarios.organizacaoid = organizacoes.id
      LEFT JOIN perfis ON perfis.id = usuarios.perfilid
      ORDER BY organizacoes.nome, usuarios.nome`,
    );

    const organizacoes = new Map<number, OrganizacaoComUsuariosDto>();

    for (const row of result.rows) {
      let organizacao = organizacoes.get(row.organizacaoid);

      if (!organizacao) {
        organizacao = {
          id: row.organizacaoid,
          nome: row.organizacaonome,
          plano: row.plano,
          usuarios: [],
        };
        organizacoes.set(row.organizacaoid, organizacao);
      }

      if (
        row.usuarioid !== null &&
        row.usuarionome !== null &&
        row.perfil !== null &&
        row.usuarioativo !== null
      ) {
        organizacao.usuarios.push({
          id: row.usuarioid,
          nome: row.usuarionome,
          perfil: row.perfil,
          ativo: row.usuarioativo,
        });
      }
    }

    return Array.from(organizacoes.values());
  }
}
