import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import type { CreatePlanoDto, PlanoDto } from './dto/create-plano.dto';
import type { UpdatePlanoDto } from './dto/update-plano.dto';

@Injectable()
export class PlanosService {
  /** Valida, cria e audita um plano. */
  async create(
    dto: CreatePlanoDto,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<PlanoDto> {
    const dados = this.validar(dto);
    return executarEmTransacao(async (client) => {
      const result = await client.query<PlanoDto>(
        `INSERT INTO planos (nome, valor, descricao, criadoporusuarioid, datacriacao, atualizadoem, atualizadoporusuarioid)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4)
        RETURNING id, nome, valor, descricao, criadoporusuarioid, datacriacao, atualizadoem, atualizadoporusuarioid`,
        [dados.nome, dados.valor, dados.descricao, usuarioId],
      );
      const plano = result.rows[0];
      await criarLog(
        {
          organizacaoid: organizacaoId,
          feitoporusuarioid: usuarioId,
          feitoem: new Date(),
          acao: 'post',
          depois: plano,
        },
        client,
      );
      return plano;
    });
  }

  /** Consulta um plano pelo identificador. */
  async findOne(id: number): Promise<PlanoDto> {
    this.validarId(id);
    const result = await postgresPool.query<PlanoDto>(
      `SELECT id, nome, valor, descricao, criadoporusuarioid, datacriacao, atualizadoem, atualizadoporusuarioid
      FROM planos WHERE id = $1`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Plano não encontrado.');
    return result.rows[0];
  }

  /** Lista todos os planos cadastrados. */
  async findAll(): Promise<PlanoDto[]> {
    const result = await postgresPool.query<PlanoDto>(
      `SELECT id, nome, valor, descricao, criadoporusuarioid, datacriacao, atualizadoem, atualizadoporusuarioid
      FROM planos ORDER BY id`,
    );
    return result.rows;
  }

  /** Valida, atualiza e audita um plano. */
  async update(
    id: number,
    dto: UpdatePlanoDto,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<PlanoDto> {
    this.validarId(id);
    const dados = this.validar(dto);
    return executarEmTransacao(async (client) => {
      const anteriorResult = await client.query<PlanoDto>(
        'SELECT * FROM planos WHERE id = $1 FOR UPDATE',
        [id],
      );
      const anterior = anteriorResult.rows[0];
      if (!anterior) throw new NotFoundException('Plano não encontrado.');
      const result = await client.query<PlanoDto>(
        `UPDATE planos SET nome = $1, valor = $2, descricao = $3, atualizadoem = CURRENT_TIMESTAMP,
          atualizadoporusuarioid = $4 WHERE id = $5
        RETURNING id, nome, valor, descricao, criadoporusuarioid, datacriacao, atualizadoem, atualizadoporusuarioid`,
        [dados.nome, dados.valor, dados.descricao, usuarioId, id],
      );
      const plano = result.rows[0];
      await criarLog(
        {
          organizacaoid: organizacaoId,
          feitoporusuarioid: usuarioId,
          feitoem: new Date(),
          acao: 'put',
          antes: anterior,
          depois: plano,
        },
        client,
      );
      return plano;
    });
  }

  /** Exclui e audita um plano que não esteja vinculado a organizações. */
  async remove(
    id: number,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<void> {
    this.validarId(id);
    try {
      await executarEmTransacao(async (client) => {
        const result = await client.query<PlanoDto>(
          'DELETE FROM planos WHERE id = $1 RETURNING *',
          [id],
        );
        const plano = result.rows[0];
        if (!plano) throw new NotFoundException('Plano não encontrado.');
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioId,
            feitoem: new Date(),
            acao: 'delete',
            antes: plano,
          },
          client,
        );
      });
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException(
          'O plano não pode ser excluído porque está vinculado a organizações.',
        );
      }
      throw error;
    }
  }

  /** Normaliza e valida os campos recebidos para persistência. */
  private validar(dto: CreatePlanoDto): {
    nome: string;
    valor: number;
    descricao: string;
  } {
    const nome = dto.nome?.trim();
    const descricao = dto.descricao?.trim();
    const valor = Number(dto.valor);
    if (!nome || nome.length > 30)
      throw new BadRequestException(
        'O nome do plano deve ter entre 1 e 30 caracteres.',
      );
    if (!Number.isFinite(valor) || valor < 0)
      throw new BadRequestException(
        'O valor do plano deve ser maior ou igual a zero.',
      );
    if (!descricao || descricao.length > 100)
      throw new BadRequestException(
        'A descrição do plano deve ter entre 1 e 100 caracteres.',
      );
    return { nome, valor, descricao };
  }

  /** Valida o identificador usado nas consultas e alterações. */
  private validarId(id: number): void {
    if (!Number.isInteger(id) || id <= 0)
      throw new BadRequestException('O plano informado é inválido.');
  }

  /** Identifica uma violação de chave estrangeira retornada pelo PostgreSQL. */
  private isForeignKeyViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === '23503' || error.code === '23001')
    );
  }
}
