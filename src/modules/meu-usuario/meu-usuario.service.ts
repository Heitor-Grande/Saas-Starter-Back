import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import type { MeuUsuarioDto } from './dto/meu-usuario.dto';
import type { UpdateMeuUsuarioDto } from './dto/update-meu-usuario.dto';

type UsuarioAnterior = Omit<MeuUsuarioDto, 'organizacao' | 'perfil'> & {
  organizacaoid: number;
};

@Injectable()
export class MeuUsuarioService {
  /** Consulta os dados do usuário autenticado pelo identificador contido no JWT. */
  async findById(usuarioId: number): Promise<MeuUsuarioDto> {
    const result = await postgresPool.query<MeuUsuarioDto>(
      `SELECT
        usuarios.id,
        usuarios.nome,
        usuarios.nomesocial,
        usuarios.cpf,
        TO_CHAR(usuarios.datanascimento, 'YYYY-MM-DD') AS datanascimento,
        usuarios.email,
        usuarios.telefone,
        usuarios.ativo,
        organizacoes.nome AS organizacao,
        perfis.nome AS perfil,
        usuarios.cargo
      FROM usuarios
      INNER JOIN organizacoes ON organizacoes.id = usuarios.organizacaoid
      INNER JOIN perfis ON perfis.id = usuarios.perfilid
      WHERE usuarios.id = $1
      LIMIT 1`,
      [usuarioId],
    );
    const usuario = result.rows[0];

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return usuario;
  }

  /** Atualiza somente os dados editáveis do usuário identificado pelo JWT. */
  async update(
    usuarioId: number,
    dto: UpdateMeuUsuarioDto,
  ): Promise<MeuUsuarioDto> {
    const dados = this.validar(dto);

    try {
      return await executarEmTransacao(async (client) => {
        const anteriorResult = await client.query<UsuarioAnterior>(
          `SELECT
            id, nome, nomesocial, cpf,
            TO_CHAR(datanascimento, 'YYYY-MM-DD') AS datanascimento,
            email, telefone, ativo, cargo, organizacaoid
          FROM usuarios
          WHERE id = $1
          FOR UPDATE`,
          [usuarioId],
        );
        const anterior = anteriorResult.rows[0];

        if (!anterior) {
          throw new NotFoundException('Usuário não encontrado.');
        }

        const result = await client.query<MeuUsuarioDto>(
          `WITH atualizado AS (
            UPDATE usuarios
            SET nome = $1,
                nomesocial = $2,
                cpf = $3,
                datanascimento = $4,
                email = $5,
                telefone = $6,
                cargo = $7,
                ativo = $8
            WHERE id = $9
            RETURNING *
          )
          SELECT
            atualizado.id,
            atualizado.nome,
            atualizado.nomesocial,
            atualizado.cpf,
            TO_CHAR(atualizado.datanascimento, 'YYYY-MM-DD') AS datanascimento,
            atualizado.email,
            atualizado.telefone,
            atualizado.ativo,
            organizacoes.nome AS organizacao,
            perfis.nome AS perfil,
            atualizado.cargo
          FROM atualizado
          INNER JOIN organizacoes ON organizacoes.id = atualizado.organizacaoid
          INNER JOIN perfis ON perfis.id = atualizado.perfilid`,
          [
            dados.nome,
            dados.nomesocial,
            dados.cpf,
            dados.datanascimento,
            dados.email,
            dados.telefone,
            dados.cargo,
            dados.ativo,
            usuarioId,
          ],
        );
        const usuario = result.rows[0];

        await criarLog(
          {
            organizacaoid: anterior.organizacaoid,
            feitoporusuarioid: usuarioId,
            feitoem: new Date(),
            acao: 'put',
            antes: anterior,
            depois: usuario,
          },
          client,
        );

        return usuario;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'O CPF ou e-mail informado já está em uso.',
        );
      }

      throw error;
    }
  }

  /** Normaliza e valida os campos permitidos na atualização. */
  private validar(dto: UpdateMeuUsuarioDto): Required<UpdateMeuUsuarioDto> {
    const dados = {
      nome: dto?.nome?.trim(),
      nomesocial: dto?.nomesocial?.trim() ?? '',
      cpf: this.apenasDigitos(dto?.cpf),
      datanascimento: dto?.datanascimento?.trim(),
      email: dto?.email?.trim().toLowerCase(),
      telefone: this.apenasDigitos(dto?.telefone),
      cargo: dto?.cargo?.trim() ?? '',
      ativo: dto?.ativo,
    };

    if (!dados.nome || dados.nome.length > 100) {
      throw new BadRequestException(
        'O nome do usuário deve ter entre 1 e 100 caracteres.',
      );
    }
    if (dados.nomesocial.length > 100) {
      throw new BadRequestException(
        'O nome social deve ter no máximo 100 caracteres.',
      );
    }
    if (dados.cpf.length !== 11) {
      throw new BadRequestException('O CPF deve conter 11 dígitos.');
    }
    if (!this.isDataValida(dados.datanascimento)) {
      throw new BadRequestException('A data de nascimento é inválida.');
    }
    if (
      !dados.email ||
      dados.email.length > 100 ||
      !dados.email.includes('@')
    ) {
      throw new BadRequestException('O e-mail informado é inválido.');
    }
    if (dados.telefone.length < 10 || dados.telefone.length > 11) {
      throw new BadRequestException('O telefone deve conter 10 ou 11 dígitos.');
    }
    if (dados.cargo.length > 100) {
      throw new BadRequestException(
        'O cargo deve ter no máximo 100 caracteres.',
      );
    }
    if (typeof dados.ativo !== 'boolean') {
      throw new BadRequestException('O status do usuário é inválido.');
    }

    return dados;
  }

  private apenasDigitos(value?: string): string {
    return value?.replace(/\D/g, '') ?? '';
  }

  private isDataValida(value?: string): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10)
    );
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
