import { Injectable } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type {
  DashboardAdminDto,
  TotalDto,
  UsuariosPorOrganizacaoDto,
  UsuariosPorPerfilDto,
} from './dto/dashboard-admin.dto';

@Injectable()
export class DashboardAdminService {
  /**
   * Consulta os indicadores gerais da aplicação em consultas independentes.
   * @returns Totais de usuários e organizações e distribuições por organização e perfil.
   */
  async findAll(): Promise<DashboardAdminDto> {
    const [
      totalUsuariosResult,
      usuariosInativosResult,
      totalOrganizacoesResult,
      usuariosPorOrganizacaoResult,
      usuariosPorPerfilResult,
    ] = await Promise.all([
      postgresPool.query<TotalDto>(
        `SELECT COUNT(*)::int AS total
        FROM usuarios`,
      ),
      postgresPool.query<TotalDto>(
        `SELECT COUNT(*)::int AS total
        FROM usuarios
        WHERE ativo = false`,
      ),
      postgresPool.query<TotalDto>(
        `SELECT COUNT(*)::int AS total
        FROM organizacoes`,
      ),
      postgresPool.query<UsuariosPorOrganizacaoDto>(
        `SELECT
          organizacoes.id AS organizacaoid,
          organizacoes.nome AS organizacao,
          COUNT(usuarios.id)::int AS totalusuarios
        FROM organizacoes
        LEFT JOIN usuarios ON usuarios.organizacaoid = organizacoes.id
        GROUP BY organizacoes.id, organizacoes.nome
        ORDER BY organizacoes.nome`,
      ),
      postgresPool.query<UsuariosPorPerfilDto>(
        `SELECT
          perfis.id AS perfilid,
          perfis.nome AS perfil,
          COUNT(usuarios.id)::int AS totalusuarios
        FROM perfis
        LEFT JOIN usuarios ON usuarios.perfilid = perfis.id
        GROUP BY perfis.id, perfis.nome
        ORDER BY perfis.nome`,
      ),
    ]);

    return {
      totalusuarios: totalUsuariosResult.rows[0]?.total ?? 0,
      usuariosinativos: usuariosInativosResult.rows[0]?.total ?? 0,
      totalorganizacoes: totalOrganizacoesResult.rows[0]?.total ?? 0,
      usuariospororganizacao: usuariosPorOrganizacaoResult.rows,
      usuariosporperfil: usuariosPorPerfilResult.rows,
    };
  }
}
