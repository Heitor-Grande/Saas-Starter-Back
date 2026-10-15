import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';

/**
 * Verifica se o perfil do usuário possui vínculo com uma permissão pelo nome.
 * @param usuarioId Identificador do usuário que terá o acesso verificado.
 * @param permissao Nome da permissão que deve estar vinculada ao perfil.
 * @returns true quando o vínculo existe ou false quando não existe.
 */
export async function verificaPermissaoUsuario(
  usuarioId: number,
  permissao: string,
): Promise<boolean> {
  if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !permissao.trim()) {
    return false;
  }

  const usuarioResult = await postgresPool.query<{ perfilid: number }>(
    'SELECT perfilid FROM usuarios WHERE id = $1',
    [usuarioId],
  );
  const usuario = usuarioResult.rows[0];

  if (!usuario) {
    return false;
  }

  const permissaoResult = await postgresPool.query<{ id: number }>(
    `SELECT pp.permissaoid AS id
    FROM perfil_permissao pp
    INNER JOIN permissoes p ON p.id = pp.permissaoid
    WHERE pp.perfilid = $1
      AND p.nome = $2
    LIMIT 1`,
    [usuario.perfilid, permissao.trim()],
  );

  return permissaoResult.rows.length > 0;
}
