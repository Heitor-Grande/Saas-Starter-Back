import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
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
   * Valida, persiste e audita um novo perfil.
   * @param dto Nome e descrição do perfil.
   * @param usuarioId Identificador do usuário responsável pela criação.
   * @param organizacaoId Identificador da organização do usuário autenticado.
   * @returns Os dados do perfil criado no PostgreSQL.
   */
  async create(
    dto: CreatePerfilDto,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<PerfilDto> {
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

    return executarEmTransacao(async (client) => {
      const result = await client.query<PerfilDto>(
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
      const perfil = result.rows[0];

      await criarLog(
        {
          organizacaoid: organizacaoId,
          feitoporusuarioid: usuarioId,
          feitoem: new Date(),
          acao: 'post',
          depois: perfil,
        },
        client,
      );

      return perfil;
    });
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

    if (!perfil) throw new NotFoundException('Perfil não encontrado.');

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
   * Atualiza e audita os dados de um perfil.
   * @param id Identificador do perfil que será atualizado.
   * @param dto Nome e descrição atualizados do perfil.
   * @param usuarioId Identificador do usuário responsável pela atualização.
   * @param organizacaoId Identificador da organização do usuário autenticado.
   * @returns Os dados atualizados do perfil.
   */
  async update(
    id: number,
    dto: UpdatePerfilDto,
    usuarioId: number,
    organizacaoId: number,
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

    return executarEmTransacao(async (client) => {
      const anteriorResult = await client.query<PerfilDto>(
        'SELECT * FROM perfis WHERE id = $1 FOR UPDATE',
        [id],
      );
      const anterior = anteriorResult.rows[0];

      if (!anterior) throw new NotFoundException('Perfil não encontrado.');

      const result = await client.query<PerfilDto>(
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

      await criarLog(
        {
          organizacaoid: organizacaoId,
          feitoporusuarioid: usuarioId,
          feitoem: new Date(),
          acao: 'put',
          antes: anterior,
          depois: perfil,
        },
        client,
      );

      return perfil;
    });
  }

  /**
   * Remove e audita um perfil quando não houver usuários vinculados.
   * @param id Identificador do perfil que será excluído.
   * @param usuarioId Identificador do usuário responsável pela exclusão.
   * @param organizacaoId Identificador da organização do usuário autenticado.
   * @returns Uma Promise concluída quando o perfil for removido.
   */
  async remove(
    id: number,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    await executarEmTransacao(async (client) => {
      const perfilResult = await client.query<PerfilDto>(
        'SELECT * FROM perfis WHERE id = $1 FOR UPDATE',
        [id],
      );
      const perfil = perfilResult.rows[0];

      if (!perfil) throw new NotFoundException('Perfil não encontrado.');

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
      await client.query('DELETE FROM perfis WHERE id = $1', [id]);
      await criarLog(
        {
          organizacaoid: organizacaoId,
          feitoporusuarioid: usuarioId,
          feitoem: new Date(),
          acao: 'delete',
          antes: perfil,
        },
        client,
      );
    });
  }

  /**
   * Associa permissões a um perfil e audita apenas os novos vínculos.
   * @param perfilId Identificador do perfil que receberá as permissões.
   * @param dto Identificadores das permissões que serão associadas.
   * @param usuarioId Identificador do usuário responsável pela associação.
   * @param organizacaoId Identificador da organização do usuário autenticado.
   * @returns Uma Promise concluída quando as associações forem persistidas.
   */
  async associatePermissions(
    perfilId: number,
    dto: AssociatePermissoesDto,
    usuarioId: number,
    organizacaoId: number,
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

    await executarEmTransacao(async (client) => {
      const result = await client.query<PerfilPermissaoRow>(
        `INSERT INTO perfil_permissao (
          perfilid,
          permissaoid,
          criadoporusuarioid,
          datacriacao
        )
        SELECT $1, permissao.permissaoid, $2, CURRENT_TIMESTAMP
        FROM UNNEST($3::INTEGER[]) AS permissao(permissaoid)
        ON CONFLICT (perfilid, permissaoid) DO NOTHING
        RETURNING permissaoid`,
        [perfilId, usuarioId, permissoesIds],
      );

      if (result.rows.length > 0) {
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioId,
            feitoem: new Date(),
            acao: 'post',
            depois: {
              perfilid: perfilId,
              permissoesids: result.rows.map((item) => item.permissaoid),
            },
          },
          client,
        );
      }
    });
  }

  /**
   * Remove e audita um vínculo entre perfil e permissão.
   * @param perfilId Identificador do perfil que perderá a permissão.
   * @param permissaoId Identificador da permissão cujo vínculo será removido.
   * @param usuarioId Identificador do usuário responsável pela remoção.
   * @param organizacaoId Identificador da organização do usuário autenticado.
   * @returns Uma Promise concluída quando o vínculo for removido.
   */
  async removePermissions(
    perfilId: number,
    permissaoId: number,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<void> {
    if (!Number.isInteger(perfilId) || perfilId <= 0) {
      throw new BadRequestException('O perfil informado é inválido.');
    }

    if (!Number.isInteger(permissaoId) || permissaoId <= 0) {
      throw new BadRequestException('A permissão informada é inválida.');
    }

    await executarEmTransacao(async (client) => {
      const result = await client.query<{
        perfilid: number;
        permissaoid: number;
      }>(
        `DELETE FROM perfil_permissao
        WHERE perfilid = $1
          AND permissaoid = $2
        RETURNING perfilid, permissaoid`,
        [perfilId, permissaoId],
      );

      if (result.rows.length > 0) {
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioId,
            feitoem: new Date(),
            acao: 'delete',
            antes: result.rows[0],
          },
          client,
        );
      }
    });
  }
}
