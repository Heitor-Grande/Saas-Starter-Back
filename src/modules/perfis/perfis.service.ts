import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { AssociatePermissoesDto } from './dto/associate-permissoes.dto';
import type {
  CreatePerfilDto,
  PerfilDetalhadoDto,
  PerfilDto,
} from './dto/create-perfil.dto';
import type { UpdatePerfilDto } from './dto/update-perfil.dto';

type PerfilPermissaoRow = {
  permissaoid: number;
};

@Injectable()
export class PerfisService {
  /**
   * Valida e persiste um novo perfil vinculado ao usuário autenticado.
   * @param dto Nome e descrição do perfil.
   * @param usuarioId Identificador do usuário responsável pela criação.
   * @returns Os dados do perfil criado no PostgreSQL.
   */
  async create(dto: CreatePerfilDto, usuarioId: number): Promise<PerfilDto> {
    const nome = dto.nome?.trim();
    const descricao = dto.descricao?.trim();

    if (!nome || nome.length > 50) {
      throw new BadRequestException(
        'O nome do perfil deve ter entre 1 e 50 caracteres.',
      );
    }

    if (!descricao || descricao.length > 100) {
      throw new BadRequestException(
        'A descrição do perfil deve ter entre 1 e 100 caracteres.',
      );
    }

    const result = await postgresPool.query<PerfilDto>(
      `INSERT INTO perfis (
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP)
      RETURNING
        id,
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem`,
      [nome, descricao, usuarioId],
    );

    return result.rows[0];
  }

  /**
   * Busca um perfil pelo identificador para exibir seus dados completos.
   * @param id Identificador do perfil que será consultado.
   * @returns Os dados do perfil encontrado.
   */
  async findOne(id: number): Promise<PerfilDetalhadoDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    const result = await postgresPool.query<PerfilDto>(
      `SELECT
        id,
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem
      FROM perfis
      WHERE id = $1`,
      [id],
    );
    const perfil = result.rows[0];

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    const permissoesResult = await postgresPool.query<PerfilPermissaoRow>(
      `SELECT permissaoid
      FROM perfil_permissao
      WHERE perfilid = $1
      ORDER BY permissaoid`,
      [id],
    );

    return {
      ...perfil,
      permissoesids: permissoesResult.rows.map(
        (permissao) => permissao.permissaoid,
      ),
    };
  }

  /**
   * Lista todos os perfis cadastrados para consulta.
   * @returns A lista de perfis ordenada pelo identificador.
   */
  async findAll(): Promise<PerfilDto[]> {
    const result = await postgresPool.query<PerfilDto>(
      `SELECT
        id,
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem
      FROM perfis
      ORDER BY id`,
    );

    return result.rows;
  }

  /**
   * Atualiza os dados de um perfil e registra o usuário responsável.
   * @param id Identificador do perfil que será atualizado.
   * @param dto Nome e descrição atualizados do perfil.
   * @param usuarioId Identificador do usuário responsável pela atualização.
   * @returns Os dados atualizados do perfil.
   */
  async update(
    id: number,
    dto: UpdatePerfilDto,
    usuarioId: number,
  ): Promise<PerfilDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    const nome = dto.nome?.trim();
    const descricao = dto.descricao?.trim();

    if (!nome || nome.length > 50) {
      throw new BadRequestException(
        'O nome do perfil deve ter entre 1 e 50 caracteres.',
      );
    }

    if (!descricao || descricao.length > 100) {
      throw new BadRequestException(
        'A descrição do perfil deve ter entre 1 e 100 caracteres.',
      );
    }

    const result = await postgresPool.query<PerfilDto>(
      `UPDATE perfis
      SET
        nome = $1,
        descricao = $2,
        atualizadoporusuarioid = $3,
        atualizadoem = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING
        id,
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem`,
      [nome, descricao, usuarioId, id],
    );
    const perfil = result.rows[0];

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return perfil;
  }

  /**
   * Remove os vínculos com permissões antes de excluir um perfil sem usuários.
   * @param id Identificador do perfil que será excluído.
   * @returns Uma Promise concluída quando o perfil for removido.
   */
  async remove(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    const client = await postgresPool.connect();

    try {
      await client.query('BEGIN');
      const usuarios = await client.query<{ id: number }>(
        'SELECT id FROM usuarios WHERE perfilid = $1 LIMIT 1',
        [id],
      );

      if (usuarios.rowCount && usuarios.rowCount > 0) {
        throw new ConflictException(
          'O perfil não pode ser excluído porque está vinculado a usuários.',
        );
      }

      await client.query('DELETE FROM perfil_permissao WHERE perfilid = $1', [
        id,
      ]);
      const result = await client.query<{ id: number }>(
        'DELETE FROM perfis WHERE id = $1 RETURNING id',
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('Perfil não encontrado.');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Associa permissões a um perfil sem criar relacionamentos duplicados.
   * @param perfilId Identificador do perfil que receberá as permissões.
   * @param dto Identificadores das permissões que serão associadas.
   * @param usuarioId Identificador do usuário responsável pela associação.
   * @returns Uma Promise concluída quando as associações forem persistidas.
   */
  async associatePermissions(
    perfilId: number,
    dto: AssociatePermissoesDto,
    usuarioId: number,
  ): Promise<void> {
    if (!Number.isInteger(perfilId) || perfilId <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    if (!Array.isArray(dto.permissoesIds) || dto.permissoesIds.length === 0) {
      throw new BadRequestException('Informe ao menos uma permissão.');
    }

    for (const permissaoId of dto.permissoesIds) {
      if (!Number.isInteger(permissaoId) || permissaoId <= 0) {
        throw new BadRequestException(
          'Uma das permissões informadas é inválida.',
        );
      }
    }

    const permissoesIds = Array.from(new Set(dto.permissoesIds));

    await postgresPool.query(
      `INSERT INTO perfil_permissao (
        perfilid,
        permissaoid,
        criadoporusuarioid,
        datacriacao
      )
      SELECT $1, permissao.permissaoid, $2, CURRENT_TIMESTAMP
      FROM UNNEST($3::INTEGER[]) AS permissao(permissaoid)
      ON CONFLICT (perfilid, permissaoid) DO NOTHING`,
      [perfilId, usuarioId, permissoesIds],
    );
  }

  /**
   * Remove um único vínculo entre um perfil e uma permissão.
   * @param perfilId Identificador do perfil que perderá a permissão.
   * @param permissaoId Identificador da permissão cujo vínculo será removido.
   * @returns Uma Promise concluída quando o vínculo for removido.
   */
  async removePermissions(
    perfilId: number,
    permissaoId: number,
  ): Promise<void> {
    if (!Number.isInteger(perfilId) || perfilId <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    if (!Number.isInteger(permissaoId) || permissaoId <= 0) {
      throw new BadRequestException('A permissão informada é inválida.');
    }

    await postgresPool.query(
      `DELETE FROM perfil_permissao
      WHERE perfilid = $1
        AND permissaoid = $2`,
      [perfilId, permissaoId],
    );
  }
}
