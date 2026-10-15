import { Injectable, NotFoundException } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { PermissaoUsuarioDto } from './dto/permissao-usuario.dto';

@Injectable()
export class CarregaPermissoesUsuarioService {
  /**
   * Calcula em TypeScript o acesso a cada permissão pelo perfil atual do usuário.
   * @param usuarioId Identificador extraído do JWT validado pelo middleware.
   * @returns Todas as permissões com a indicação de acesso pelo perfil.
   */
  async carregar(usuarioId: number): Promise<PermissaoUsuarioDto[]> {
    const usuarios = await postgresPool.query<{ perfilid: number }>(
      'SELECT perfilid FROM usuarios WHERE id = $1',
      [usuarioId],
    );
    const usuario = usuarios.rows[0];

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const vinculos = await postgresPool.query<{ permissaoid: number }>(
      'SELECT permissaoid FROM perfil_permissao WHERE perfilid = $1',
      [usuario.perfilid],
    );
    const permissoes = await postgresPool.query<{ id: number; nome: string }>(
      'SELECT id, nome FROM permissoes ORDER BY id',
    );
    const permissoesDoPerfil = new Set(
      vinculos.rows.map((vinculo) => vinculo.permissaoid),
    );

    return permissoes.rows.map((permissao) => ({
      permissão: permissao.nome,
      temacesso: permissoesDoPerfil.has(permissao.id),
    }));
  }
}
