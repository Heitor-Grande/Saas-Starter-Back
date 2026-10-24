import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import type {
  CreatePermissaoDto,
  PermissaoDto,
} from './dto/create-permissao.dto';
import type { UpdatePermissaoDto } from './dto/update-permissao.dto';

@Injectable()
export class PermissoesService {
  /**
   * Valida e persiste uma nova permissão vinculada ao usuário autenticado.
   * @param dto Nome e descrição da permissão.
   * @param usuarioId Identificador do usuário responsável pela criação.
   * @returns Os dados da permissão criada no PostgreSQL.
   */
  async create(
    dto: CreatePermissaoDto,
    usuarioId: number,
  ): Promise<PermissaoDto> {
    const nome = dto.nome?.trim();
    const descricao = dto.descricao?.trim();

    if (!nome || nome.length > 30) {
      throw new BadRequestException(
        'O nome da permissão deve ter entre 1 e 30 caracteres.',
      );
    }

    if (!descricao || descricao.length > 100) {
      throw new BadRequestException(
        'A descrição da permissão deve ter entre 1 e 100 caracteres.',
      );
    }

    const result = await postgresPool.query<PermissaoDto>(
      `INSERT INTO permissoes (
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
   * Busca uma permissão pelo identificador para exibir seus dados completos.
   * @param id Identificador da permissão que será consultada.
   * @returns Os dados da permissão encontrada.
   */
  async findOne(id: number): Promise<PermissaoDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('A permissão informada é inválida.');
    }

    const result = await postgresPool.query<PermissaoDto>(
      `SELECT
        id,
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem
      FROM permissoes
      WHERE id = $1`,
      [id],
    );

    const permissao = result.rows[0];

    if (!permissao) {
      throw new NotFoundException('Permissão não encontrada.');
    }

    return permissao;
  }

  /**
   * Lista todas as permissões cadastradas para consulta.
   * @returns A lista de permissões ordenada pelo identificador.
   */
  async findAll(): Promise<PermissaoDto[]> {
    const result = await postgresPool.query<PermissaoDto>(
      `SELECT
        id,
        nome,
        descricao,
        criadoporusuarioid,
        datacriacao,
        atualizadoporusuarioid,
        atualizadoem
      FROM permissoes
      ORDER BY id`,
    );

    return result.rows;
  }

  /**
   * Atualiza os dados de uma permissão e registra o usuário responsável.
   * @param id Identificador da permissão que será atualizada.
   * @param dto Nome e descrição atualizados da permissão.
   * @param usuarioId Identificador do usuário responsável pela atualização.
   * @returns Os dados atualizados da permissão.
   */
  async update(
    id: number,
    dto: UpdatePermissaoDto,
    usuarioId: number,
  ): Promise<PermissaoDto> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('A permissão informada é inválida.');
    }

    const nome = dto.nome?.trim();
    const descricao = dto.descricao?.trim();

    if (!nome || nome.length > 30) {
      throw new BadRequestException(
        'O nome da permissão deve ter entre 1 e 30 caracteres.',
      );
    }

    if (!descricao || descricao.length > 100) {
      throw new BadRequestException(
        'A descrição da permissão deve ter entre 1 e 100 caracteres.',
      );
    }

    const result = await postgresPool.query<PermissaoDto>(
      `UPDATE permissoes
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
    const permissao = result.rows[0];

    if (!permissao) {
      throw new NotFoundException('Permissão não encontrada.');
    }

    return permissao;
  }

  /**
   * Exclui os vínculos com perfis antes de remover a permissão em uma transação.
   * @param id Identificador da permissão que será excluída.
   * @returns Uma Promise concluída quando a permissão for removida.
   */
  async remove(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('A permissão informada é inválida.');
    }

    await executarEmTransacao(async (client) => {
      await client.query(
        'DELETE FROM perfil_permissao WHERE permissaoid = $1',
        [id],
      );
      const result = await client.query<{ id: number }>(
        'DELETE FROM permissoes WHERE id = $1 RETURNING id',
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('Permissão não encontrada.');
      }
    });
  }
}
