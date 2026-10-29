import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { generateHash } from '../../util/bcrypt/bcrypt';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import { validarForcaSenha } from '../../util/validar-forca-senha/validar-forca-senha';
import type {
  CreateUsuarioDto,
  PerfilOpcaoDto,
  UpdateUsuarioDto,
  UsuarioDto,
  UsuarioFormularioDto,
} from './dto/usuario.dto';

type QueryExecutor = Pick<Pool | PoolClient, 'query'>;
type UsuarioValidado = Omit<CreateUsuarioDto, 'senha'>;

@Injectable()
export class UsuariosService {
  /** Cria um usuário vinculado à organização do JWT. */
  async create(
    organizacaoId: number,
    usuarioAutenticadoId: number,
    dto: CreateUsuarioDto,
  ): Promise<UsuarioDto> {
    const dados = this.validar(dto);
    const senha = this.gerarSenha(dto?.senha);

    try {
      return await executarEmTransacao(async (client) => {
        await this.validarPerfil(dados.perfilid, client);
        const result = await client.query<UsuarioDto>(
          `WITH criado AS (
            INSERT INTO usuarios (
              nome, nomesocial, cpf, datanascimento, email, telefone,
              organizacaoid, perfilid, cargo, ativo, senhahash,
              saltroundsenha, datacriacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
            RETURNING *
          )
          SELECT criado.id, criado.nome, criado.nomesocial, criado.cpf,
            TO_CHAR(criado.datanascimento, 'YYYY-MM-DD') AS datanascimento,
            criado.email, criado.telefone, criado.perfilid, perfis.nome AS perfil,
            criado.cargo, criado.ativo, criado.datacriacao
          FROM criado INNER JOIN perfis ON perfis.id = criado.perfilid`,
          [
            dados.nome,
            dados.nomesocial,
            dados.cpf,
            dados.datanascimento,
            dados.email,
            dados.telefone,
            organizacaoId,
            dados.perfilid,
            dados.cargo,
            dados.ativo,
            senha.hash,
            senha.saltRounds,
          ],
        );
        const usuario = result.rows[0];
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioAutenticadoId,
            feitoem: new Date(),
            acao: 'post',
            depois: usuario,
          },
          client,
        );
        return usuario;
      });
    } catch (error) {
      this.tratarErroBanco(error);
    }
  }

  /** Lista somente os usuários pertencentes à organização do JWT. */
  async findAll(organizacaoId: number): Promise<UsuarioDto[]> {
    const result = await postgresPool.query<UsuarioDto>(
      `${this.selectUsuario()}
      WHERE usuarios.organizacaoid = $1
      ORDER BY usuarios.nome`,
      [organizacaoId],
    );
    return result.rows;
  }

  /** Abre os dados de um usuário da organização e as opções de perfil. */
  async findOne(
    id: number,
    organizacaoId: number,
  ): Promise<UsuarioFormularioDto> {
    this.validarId(id);
    const usuario = await this.buscar(id, organizacaoId, postgresPool);
    const perfis = await postgresPool.query<PerfilOpcaoDto>(
      'SELECT id, nome FROM perfis ORDER BY nome',
    );
    return { ...usuario, perfis: perfis.rows };
  }

  /** Atualiza um usuário sem permitir a troca de organização. */
  async update(
    id: number,
    organizacaoId: number,
    usuarioAutenticadoId: number,
    dto: UpdateUsuarioDto,
  ): Promise<UsuarioDto> {
    this.validarId(id);
    const dados = this.validar(dto);

    try {
      return await executarEmTransacao(async (client) => {
        const anterior = await this.buscar(id, organizacaoId, client, true);
        await this.validarPerfil(dados.perfilid, client);
        const result = await client.query<UsuarioDto>(
          `WITH atualizado AS (
            UPDATE usuarios SET
              nome = $1, nomesocial = $2, cpf = $3, datanascimento = $4,
              email = $5, telefone = $6, perfilid = $7, cargo = $8, ativo = $9
            WHERE id = $10 AND organizacaoid = $11
            RETURNING *
          )
          SELECT atualizado.id, atualizado.nome, atualizado.nomesocial, atualizado.cpf,
            TO_CHAR(atualizado.datanascimento, 'YYYY-MM-DD') AS datanascimento,
            atualizado.email, atualizado.telefone, atualizado.perfilid,
            perfis.nome AS perfil, atualizado.cargo, atualizado.ativo,
            atualizado.datacriacao
          FROM atualizado INNER JOIN perfis ON perfis.id = atualizado.perfilid`,
          [
            dados.nome,
            dados.nomesocial,
            dados.cpf,
            dados.datanascimento,
            dados.email,
            dados.telefone,
            dados.perfilid,
            dados.cargo,
            dados.ativo,
            id,
            organizacaoId,
          ],
        );
        const usuario = result.rows[0];
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioAutenticadoId,
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
      this.tratarErroBanco(error);
    }
  }

  /** Exclui um usuário da organização, exceto o próprio usuário autenticado. */
  async remove(
    id: number,
    organizacaoId: number,
    usuarioAutenticadoId: number,
  ): Promise<void> {
    this.validarId(id);
    if (id === usuarioAutenticadoId) {
      throw new ForbiddenException(
        'Não é permitido excluir o próprio usuário.',
      );
    }

    try {
      await executarEmTransacao(async (client) => {
        const anterior = await this.buscar(id, organizacaoId, client, true);
        await client.query(
          'DELETE FROM usuarios WHERE id = $1 AND organizacaoid = $2',
          [id, organizacaoId],
        );
        await criarLog(
          {
            organizacaoid: organizacaoId,
            feitoporusuarioid: usuarioAutenticadoId,
            feitoem: new Date(),
            acao: 'delete',
            antes: anterior,
          },
          client,
        );
      });
    } catch (error) {
      this.tratarErroBanco(error);
    }
  }

  private async buscar(
    id: number,
    organizacaoId: number,
    executor: QueryExecutor,
    bloquear = false,
  ): Promise<UsuarioDto> {
    const result = await executor.query<UsuarioDto>(
      `${this.selectUsuario()}
      WHERE usuarios.id = $1 AND usuarios.organizacaoid = $2${bloquear ? ' FOR UPDATE OF usuarios' : ''}`,
      [id, organizacaoId],
    );
    const usuario = result.rows[0];
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return usuario;
  }

  private selectUsuario(): string {
    return `SELECT usuarios.id, usuarios.nome, usuarios.nomesocial, usuarios.cpf,
      TO_CHAR(usuarios.datanascimento, 'YYYY-MM-DD') AS datanascimento,
      usuarios.email, usuarios.telefone, usuarios.perfilid, perfis.nome AS perfil,
      usuarios.cargo, usuarios.ativo, usuarios.datacriacao
    FROM usuarios INNER JOIN perfis ON perfis.id = usuarios.perfilid`;
  }

  private async validarPerfil(
    perfilId: number,
    executor: QueryExecutor,
  ): Promise<void> {
    const result = await executor.query('SELECT id FROM perfis WHERE id = $1', [
      perfilId,
    ]);
    if (!result.rows[0]) {
      throw new BadRequestException('O perfil informado é inválido.');
    }
  }

  private validar(dto: UpdateUsuarioDto): UsuarioValidado {
    const dados = {
      nome: dto?.nome?.trim(),
      nomesocial: dto?.nomesocial?.trim() ?? '',
      cpf: this.apenasDigitos(dto?.cpf),
      datanascimento: dto?.datanascimento?.trim(),
      email: dto?.email?.trim().toLowerCase(),
      telefone: this.apenasDigitos(dto?.telefone),
      perfilid: Number(dto?.perfilid),
      cargo: dto?.cargo?.trim() ?? '',
      ativo: dto?.ativo,
    };
    if (!dados.nome || dados.nome.length > 100)
      throw new BadRequestException(
        'O nome do usuário deve ter entre 1 e 100 caracteres.',
      );
    if (dados.nomesocial.length > 100)
      throw new BadRequestException(
        'O nome social deve ter no máximo 100 caracteres.',
      );
    if (dados.cpf.length !== 11)
      throw new BadRequestException('O CPF deve conter 11 dígitos.');
    if (!this.isDataValida(dados.datanascimento))
      throw new BadRequestException('A data de nascimento é inválida.');
    if (!dados.email || dados.email.length > 100 || !dados.email.includes('@'))
      throw new BadRequestException('O e-mail informado é inválido.');
    if (dados.telefone.length < 10 || dados.telefone.length > 11)
      throw new BadRequestException('O telefone deve conter 10 ou 11 dígitos.');
    if (!Number.isInteger(dados.perfilid) || dados.perfilid <= 0)
      throw new BadRequestException('O perfil informado é inválido.');
    if (dados.cargo.length > 100)
      throw new BadRequestException(
        'O cargo deve ter no máximo 100 caracteres.',
      );
    if (typeof dados.ativo !== 'boolean')
      throw new BadRequestException('O status do usuário é inválido.');
    return dados;
  }

  private gerarSenha(senha?: string): { hash: string; saltRounds: number } {
    if (!validarForcaSenha(senha)) {
      throw new BadRequestException(
        'A senha deve ter no mínimo 5 caracteres, 1 número, 1 letra maiúscula e 1 caractere especial.',
      );
    }
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
    if (!Number.isInteger(saltRounds) || saltRounds <= 0) {
      throw new BadRequestException(
        'A variável de ambiente BCRYPT_SALT_ROUNDS é inválida.',
      );
    }
    return generateHash(senha!, saltRounds);
  }

  private validarId(id: number): void {
    if (!Number.isInteger(id) || id <= 0)
      throw new BadRequestException('O usuário informado é inválido.');
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

  private tratarErroBanco(error: unknown): never {
    if (this.hasCode(error, '23505'))
      throw new ConflictException('O CPF ou e-mail informado já está em uso.');
    if (this.hasCode(error, '23503'))
      throw new ConflictException(
        'O usuário não pode ser excluído porque possui registros vinculados.',
      );
    throw error;
  }

  private hasCode(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === code
    );
  }
}
