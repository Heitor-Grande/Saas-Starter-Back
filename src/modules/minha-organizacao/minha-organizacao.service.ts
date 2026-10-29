import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import type {
  MinhaOrganizacaoDto,
  OpcaoOrganizacaoDto,
  UpdateMinhaOrganizacaoDto,
} from './dto/minha-organizacao.dto';

type QueryExecutor = Pick<Pool | PoolClient, 'query'>;
type OrganizacaoRow = Omit<MinhaOrganizacaoDto, 'usuarios' | 'planos'>;

@Injectable()
export class MinhaOrganizacaoService {
  /** Consulta a organização identificada exclusivamente pelo JWT. */
  async findById(organizacaoId: number): Promise<MinhaOrganizacaoDto> {
    return this.carregar(organizacaoId, postgresPool);
  }

  /** Atualiza todos os campos editáveis da organização e preserva seu status. */
  async update(
    organizacaoId: number,
    usuarioId: number,
    dto: UpdateMinhaOrganizacaoDto,
  ): Promise<MinhaOrganizacaoDto> {
    const dados = this.validar(dto);

    try {
      return await executarEmTransacao(async (client) => {
        const anteriorResult = await client.query<OrganizacaoRow>(
          'SELECT * FROM organizacoes WHERE id = $1 FOR UPDATE',
          [organizacaoId],
        );
        const anterior = anteriorResult.rows[0];
        if (!anterior) {
          throw new NotFoundException('Organização não encontrada.');
        }

        const plano = await client.query(
          'SELECT id FROM planos WHERE id = $1',
          [dados.planoid],
        );
        if (!plano.rows[0]) {
          throw new BadRequestException('O plano informado é inválido.');
        }

        const responsavel = await client.query(
          'SELECT id FROM usuarios WHERE id = $1 AND organizacaoid = $2',
          [dados.usuarioresponsavelid, organizacaoId],
        );
        if (!responsavel.rows[0]) {
          throw new BadRequestException(
            'O usuário responsável deve pertencer à organização.',
          );
        }

        await client.query(
          `UPDATE organizacoes
          SET nome = $1,
              cnpj = $2,
              planoid = $3,
              usuarioresponsavelid = $4,
              cep = $5,
              logradouro = $6,
              numero = $7,
              complemento = $8,
              bairro = $9,
              cidade = $10,
              estado = $11,
              atualizadoem = CURRENT_TIMESTAMP,
              atualizadoporusuarioid = $12
          WHERE id = $13`,
          [
            dados.nome,
            dados.cnpj,
            dados.planoid,
            dados.usuarioresponsavelid,
            dados.cep,
            dados.logradouro,
            dados.numero,
            dados.complemento,
            dados.bairro,
            dados.cidade,
            dados.estado,
            usuarioId,
            organizacaoId,
          ],
        );

        const organizacao = await this.carregar(organizacaoId, client);
        const { usuarios: _usuarios, planos: _planos, ...depois } = organizacao;
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioId,
            feitoem: new Date(),
            acao: 'put',
            antes: anterior,
            depois,
          },
          client,
        );

        return organizacao;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('O CNPJ informado já está em uso.');
      }
      throw error;
    }
  }

  private async carregar(
    organizacaoId: number,
    executor: QueryExecutor,
  ): Promise<MinhaOrganizacaoDto> {
    const result = await executor.query<OrganizacaoRow>(
      `SELECT
        organizacoes.id,
        organizacoes.nome,
        organizacoes.cnpj,
        organizacoes.planoid,
        planos.nome AS plano,
        organizacoes.usuarioresponsavelid,
        organizacoes.cep,
        organizacoes.logradouro,
        organizacoes.numero,
        organizacoes.complemento,
        organizacoes.bairro,
        organizacoes.cidade,
        organizacoes.estado
      FROM organizacoes
      INNER JOIN planos ON planos.id = organizacoes.planoid
      WHERE organizacoes.id = $1`,
      [organizacaoId],
    );
    const organizacao = result.rows[0];
    if (!organizacao) {
      throw new NotFoundException('Organização não encontrada.');
    }

    const usuarios = await executor.query<OpcaoOrganizacaoDto>(
      'SELECT id, nome FROM usuarios WHERE organizacaoid = $1 ORDER BY nome',
      [organizacaoId],
    );
    const planos = await executor.query<OpcaoOrganizacaoDto>(
      'SELECT id, nome FROM planos ORDER BY nome',
    );

    return { ...organizacao, usuarios: usuarios.rows, planos: planos.rows };
  }

  private validar(
    dto: UpdateMinhaOrganizacaoDto,
  ): Required<UpdateMinhaOrganizacaoDto> {
    const dados = {
      nome: dto?.nome?.trim(),
      cnpj: this.apenasDigitos(dto?.cnpj),
      planoid: Number(dto?.planoid),
      usuarioresponsavelid: Number(dto?.usuarioresponsavelid),
      cep: this.apenasDigitos(dto?.cep),
      logradouro: dto?.logradouro?.trim(),
      numero: dto?.numero?.trim(),
      complemento: dto?.complemento?.trim() ?? '',
      bairro: dto?.bairro?.trim(),
      cidade: dto?.cidade?.trim(),
      estado: dto?.estado?.trim().toUpperCase(),
    };

    if (!dados.nome || dados.nome.length > 255) {
      throw new BadRequestException(
        'O nome da organização deve ter entre 1 e 255 caracteres.',
      );
    }
    if (dados.cnpj.length !== 14) {
      throw new BadRequestException('O CNPJ deve conter 14 dígitos.');
    }
    if (!Number.isInteger(dados.planoid) || dados.planoid <= 0) {
      throw new BadRequestException('O plano informado é inválido.');
    }
    if (
      !Number.isInteger(dados.usuarioresponsavelid) ||
      dados.usuarioresponsavelid <= 0
    ) {
      throw new BadRequestException('O usuário responsável é inválido.');
    }
    if (dados.cep.length !== 8) {
      throw new BadRequestException('O CEP deve conter 8 dígitos.');
    }
    if (!dados.logradouro || dados.logradouro.length > 50) {
      throw new BadRequestException(
        'O logradouro deve ter entre 1 e 50 caracteres.',
      );
    }
    if (!dados.numero || dados.numero.length > 4) {
      throw new BadRequestException(
        'O número deve ter entre 1 e 4 caracteres.',
      );
    }
    if (dados.complemento.length > 255) {
      throw new BadRequestException(
        'O complemento deve ter no máximo 255 caracteres.',
      );
    }
    if (!dados.bairro || dados.bairro.length > 50) {
      throw new BadRequestException(
        'O bairro deve ter entre 1 e 50 caracteres.',
      );
    }
    if (!dados.cidade || dados.cidade.length > 50) {
      throw new BadRequestException(
        'A cidade deve ter entre 1 e 50 caracteres.',
      );
    }
    if (!/^[A-Z]{2}$/.test(dados.estado)) {
      throw new BadRequestException('O estado deve conter 2 letras.');
    }

    return dados;
  }

  private apenasDigitos(value?: string): string {
    return value?.replace(/\D/g, '') ?? '';
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
