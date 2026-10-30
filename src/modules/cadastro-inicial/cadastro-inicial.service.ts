import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import type { JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { generateHash, validateHash } from '../../util/bcrypt/bcrypt';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import { signJwtPayload, verifyJwtPayload } from '../../util/jwt/jwt';
import { descriptografar } from '../../util/nodeCrypto/nodeCrypto';
import { validarForcaSenha } from '../../util/validar-forca-senha/validar-forca-senha';
import type {
  CadastroInicialDto,
  CadastroInicialOrganizacaoDto,
  CadastroInicialUsuarioDto,
  CreateCadastroInicialDto,
  ConfirmarEmailCadastroDto,
  SolicitacaoConfirmacaoCadastroDto,
} from './dto/create-cadastro-inicial.dto';

type TokenConfirmacaoCadastro = JsonWebTokenPayload & {
  finalidade: 'confirmacao-cadastro';
  codigoHash: string;
  cadastroHash: string;
};

type ConfiguracaoSmtp = {
  nome_aplicacao: string;
  smtp_servidor: string | null;
  smtp_porta: number | null;
  smtp_usuario: string | null;
  smtp_senha: string | null;
  smtp_remetente_nome: string | null;
  smtp_remetente_email: string | null;
};

@Injectable()
export class CadastroInicialService {
  private readonly validadeConfirmacaoSegundos = Math.max(
    60,
    Number(process.env.CADASTRO_EMAIL_JWT_EXPIRES_IN_SECONDS) || 600,
  );

  /** Valida o cadastro, verifica duplicidades e envia o código de confirmação. */
  async solicitarConfirmacao(
    dto: CreateCadastroInicialDto,
  ): Promise<SolicitacaoConfirmacaoCadastroDto> {
    const cadastroNormalizado = this.normalizarCadastro(dto);
    await this.validarDuplicidade(cadastroNormalizado);
    const codigo = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codigoHash = generateHash(codigo, this.obterSaltRounds()).hash;
    const token = signJwtPayload<TokenConfirmacaoCadastro>(
      {
        finalidade: 'confirmacao-cadastro',
        codigoHash,
        cadastroHash: this.hashCadastro(cadastroNormalizado),
      },
      this.validadeConfirmacaoSegundos,
    );

    await this.enviarCodigo(cadastroNormalizado.usuario.email, codigo);
    return { token, expiraEmSegundos: this.validadeConfirmacaoSegundos };
  }

  /** Confere código e integridade dos dados antes de executar a criação. */
  async confirmarEmail(
    dto: ConfirmarEmailCadastroDto,
  ): Promise<CadastroInicialDto> {
    const payload = dto?.token
      ? verifyJwtPayload<TokenConfirmacaoCadastro>(dto.token)
      : null;
    const codigo = dto?.codigo?.trim();
    if (
      !payload ||
      payload.finalidade !== 'confirmacao-cadastro' ||
      !/^\d{6}$/.test(codigo || '') ||
      !validateHash(codigo!, payload.codigoHash)
    ) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    const cadastroNormalizado = this.normalizarCadastro(dto.cadastro);
    if (this.hashCadastro(cadastroNormalizado) !== payload.cadastroHash) {
      throw new UnauthorizedException(
        'Os dados do cadastro foram alterados. Solicite um novo código.',
      );
    }
    await this.validarDuplicidade(cadastroNormalizado);
    return this.create(cadastroNormalizado);
  }

  /**
   * Valida, cria a organizacao inicial e vincula o primeiro usuario responsavel.
   * @param dto Dados da organizacao e do usuario responsavel recebidos na requisicao.
   * @returns Os dados cadastrados sem expor a senha ou o hash armazenado.
   */
  async create(dto: CreateCadastroInicialDto): Promise<CadastroInicialDto> {
    const organizacao = this.validarOrganizacao(dto.organizacao);
    const usuario = this.validarUsuario(dto.usuario);
    const senha = dto.usuario?.senha;
    if (process.env.BCRYPT_SALT_ROUNDS === undefined) {
      throw new BadRequestException(
        `A variavel de ambiente BCRYPT_SALT_ROUNDS não está definida.`,
      );
    }
    const senhaHash = generateHash(
      senha,
      Number(process.env.BCRYPT_SALT_ROUNDS),
    );
    try {
      return await executarEmTransacao(async (client) => {
        const organizacaoResult =
          await client.query<CadastroInicialOrganizacaoDto>(
            `INSERT INTO organizacoes (
            nome,
            cnpj,
            planoid,
            usuarioresponsavelid,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            datacriacao,
            criadoporusuarioid,
            atualizadoem,
            atualizadoporusuarioid
          ) VALUES (
            $1, $2, $3, NULL, $4, $5, $6, $7, $8, $9, $10,
            CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL
          )
          RETURNING
            id,
            nome,
            cnpj,
            planoid,
            usuarioresponsavelid,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            datacriacao,
            criadoporusuarioid,
            atualizadoem,
            atualizadoporusuarioid`,
            [
              organizacao.nome,
              organizacao.cnpj,
              organizacao.planoid,
              organizacao.cep,
              organizacao.logradouro,
              organizacao.numero,
              organizacao.complemento,
              organizacao.bairro,
              organizacao.cidade,
              organizacao.estado,
            ],
          );
        const organizacaoCriada = organizacaoResult.rows[0];

        const usuarioResult = await client.query<CadastroInicialUsuarioDto>(
          `INSERT INTO usuarios (
          nome,
          nomesocial,
          cpf,
          datanascimento,
          email,
          telefone,
          organizacaoid,
          perfilid,
          cargo,
          ativo,
          senhahash,
          saltroundsenha,
          datacriacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          nome,
          nomesocial,
          cpf,
          datanascimento,
          email,
          telefone,
          organizacaoid,
          perfilid,
          cargo,
          ativo,
          datacriacao`,
          [
            usuario.nome,
            usuario.nomesocial,
            usuario.cpf,
            usuario.datanascimento,
            usuario.email,
            usuario.telefone,
            organizacaoCriada.id,
            10, // Perfil padrao de usuario responsavel
            usuario.cargo,
            usuario.ativo,
            senhaHash.hash,
            senhaHash.saltRounds,
          ],
        );
        const usuarioCriado = usuarioResult.rows[0];

        const organizacaoAtualizadaResult =
          await client.query<CadastroInicialOrganizacaoDto>(
            `UPDATE organizacoes
          SET
            usuarioresponsavelid = $1,
            criadoporusuarioid = $1,
            atualizadoporusuarioid = $1,
            atualizadoem = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING
            id,
            nome,
            cnpj,
            planoid,
            usuarioresponsavelid,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            datacriacao,
            criadoporusuarioid,
            atualizadoem,
            atualizadoporusuarioid`,
            [usuarioCriado.id, organizacaoCriada.id],
          );

        await criarLog(
          {
            organizacaoid: organizacaoCriada.id,
            feitoporusuarioid: usuarioCriado.id,
            feitoem: new Date(),
            acao: 'post',
            depois: {
              organizacao: organizacaoAtualizadaResult.rows[0],
              usuario: usuarioCriado,
            },
          },
          client,
        );

        return {
          organizacao: organizacaoAtualizadaResult.rows[0],
          usuario: usuarioCriado,
        };
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException(
          'Ja existe um cadastro com CNPJ, CPF ou e-mail informado.',
        );
      }

      throw error;
    }
  }

  private normalizarCadastro(
    dto: CreateCadastroInicialDto,
  ): CreateCadastroInicialDto {
    const organizacao = this.validarOrganizacao(dto?.organizacao);
    const usuario = this.validarUsuario(dto?.usuario);
    return { organizacao, usuario: { ...usuario, senha: dto.usuario.senha } };
  }

  private hashCadastro(dto: CreateCadastroInicialDto): string {
    return createHash('sha256').update(JSON.stringify(dto)).digest('base64url');
  }

  private async validarDuplicidade(
    dto: CreateCadastroInicialDto,
  ): Promise<void> {
    const result = await postgresPool.query(
      `SELECT 1
       WHERE EXISTS (SELECT 1 FROM organizacoes WHERE cnpj = $1)
          OR EXISTS (SELECT 1 FROM usuarios WHERE cpf = $2 OR email = $3)
       LIMIT 1`,
      [dto.organizacao.cnpj, dto.usuario.cpf, dto.usuario.email],
    );
    if (result.rowCount) {
      throw new BadRequestException(
        'Já existe um cadastro com CNPJ, CPF ou e-mail informado.',
      );
    }
  }

  private async enviarCodigo(email: string, codigo: string): Promise<void> {
    const result = await postgresPool.query<ConfiguracaoSmtp>(
      `SELECT nome_aplicacao, smtp_servidor, smtp_porta, smtp_usuario,
        smtp_senha, smtp_remetente_nome, smtp_remetente_email
       FROM configuracao_global WHERE id = 1`,
    );
    const config = result.rows[0];
    if (
      !config?.smtp_servidor ||
      !config.smtp_porta ||
      !config.smtp_usuario ||
      !config.smtp_senha ||
      !config.smtp_remetente_email
    ) {
      throw new Error('Configuração SMTP incompleta.');
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_servidor,
      port: config.smtp_porta,
      secure: config.smtp_porta === 465,
      auth: {
        user: config.smtp_usuario,
        pass: descriptografar(config.smtp_senha),
      },
    });
    await transporter.sendMail({
      from: {
        name: config.smtp_remetente_nome || config.nome_aplicacao,
        address: config.smtp_remetente_email,
      },
      to: email,
      subject: `${codigo} é o seu código de confirmação`,
      text: `Seu código de confirmação de cadastro é ${codigo}. Ele expira em ${Math.ceil(this.validadeConfirmacaoSegundos / 60)} minutos.`,
      html: `<p>Seu código de confirmação de cadastro é:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p><p>Ele expira em ${Math.ceil(this.validadeConfirmacaoSegundos / 60)} minutos.</p>`,
    });
  }

  private obterSaltRounds(): number {
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS);
    if (!Number.isInteger(rounds) || rounds < 4 || rounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS deve ser um número entre 4 e 15.');
    }
    return rounds;
  }

  /**
   * Normaliza e valida os dados obrigatorios da organizacao inicial.
   * @param organizacao Dados da organizacao recebidos no DTO principal.
   * @returns Os dados da organizacao prontos para persistencia.
   */
  private validarOrganizacao(
    organizacao: CreateCadastroInicialDto['organizacao'],
  ): Required<CreateCadastroInicialDto['organizacao']> {
    const dados = {
      nome: organizacao?.nome?.trim(),
      cnpj: this.apenasDigitos(organizacao?.cnpj),
      planoid: Number(organizacao?.planoid),
      cep: this.apenasDigitos(organizacao?.cep),
      logradouro: organizacao?.logradouro?.trim(),
      numero: organizacao?.numero?.trim(),
      complemento: organizacao?.complemento?.trim() ?? '',
      bairro: organizacao?.bairro?.trim(),
      cidade: organizacao?.cidade?.trim(),
      estado: organizacao?.estado?.trim().toUpperCase(),
    };

    if (!dados.nome || dados.nome.length > 255) {
      throw new BadRequestException(
        'O nome da organizacao deve ter entre 1 e 255 caracteres.',
      );
    }

    if (dados.cnpj.length !== 14) {
      throw new BadRequestException('O CNPJ deve conter 14 digitos.');
    }

    if (!Number.isInteger(dados.planoid) || dados.planoid <= 0) {
      throw new BadRequestException('O plano informado é invalido.');
    }

    if (dados.cep.length !== 8) {
      throw new BadRequestException('O CEP deve conter 8 digitos.');
    }

    if (!dados.logradouro || dados.logradouro.length > 50) {
      throw new BadRequestException(
        'O logradouro deve ter entre 1 e 50 caracteres.',
      );
    }

    if (!dados.numero || dados.numero.length > 4) {
      throw new BadRequestException(
        'O numero deve ter entre 1 e 4 caracteres.',
      );
    }

    if (dados.complemento.length > 255) {
      throw new BadRequestException(
        'O complemento deve ter no maximo 255 caracteres.',
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

  /**
   * Normaliza e valida os dados obrigatorios do primeiro usuario.
   * @param usuario Dados do usuario recebidos no DTO principal.
   * @returns Os dados do usuario prontos para persistencia.
   */
  private validarUsuario(
    usuario: CreateCadastroInicialDto['usuario'],
  ): Required<Omit<CreateCadastroInicialDto['usuario'], 'senha'>> {
    const dados = {
      nome: usuario?.nome?.trim(),
      nomesocial: usuario?.nomesocial?.trim() ?? '',
      cpf: this.apenasDigitos(usuario?.cpf),
      datanascimento: usuario?.datanascimento?.trim(),
      email: usuario?.email?.trim().toLowerCase(),
      telefone: this.apenasDigitos(usuario?.telefone),
      perfilid: Number(usuario?.perfilid),
      cargo: usuario?.cargo?.trim() ?? '',
      ativo: usuario?.ativo ?? true,
    };

    if (!dados.nome || dados.nome.length > 100) {
      throw new BadRequestException(
        'O nome do usuario deve ter entre 1 e 100 caracteres.',
      );
    }

    if (dados.nomesocial.length > 100) {
      throw new BadRequestException(
        'O nome social deve ter no maximo 100 caracteres.',
      );
    }

    if (dados.cpf.length !== 11) {
      throw new BadRequestException('O CPF deve conter 11 digitos.');
    }

    if (!this.isDataValida(dados.datanascimento)) {
      throw new BadRequestException('A data de nascimento e invalida.');
    }

    if (
      !dados.email ||
      dados.email.length > 100 ||
      !dados.email.includes('@')
    ) {
      throw new BadRequestException('O e-mail informado é invalido.');
    }

    if (dados.telefone.length < 10 || dados.telefone.length > 11) {
      throw new BadRequestException('O telefone deve conter 10 ou 11 digitos.');
    }

    if (dados.cargo.length > 100) {
      throw new BadRequestException(
        'O cargo deve ter no maximo 100 caracteres.',
      );
    }

    if (typeof dados.ativo !== 'boolean') {
      throw new BadRequestException('O status do usuario é invalido.');
    }

    if (!validarForcaSenha(usuario?.senha)) {
      throw new BadRequestException(
        'A senha deve ter no minimo 5 caracteres, 1 numero, 1 letra maiuscula e 1 caractere especial.',
      );
    }

    return dados;
  }

  /**
   * Remove caracteres nao numericos para armazenar documentos e contatos.
   * @param value Texto recebido do cliente com ou sem mascara.
   * @returns Apenas os digitos encontrados no texto.
   */
  private apenasDigitos(value?: string): string {
    return value?.replace(/\D/g, '') ?? '';
  }

  /**
   * Confirma se a data recebida segue o formato aceito pelo banco.
   * @param value Data em formato ISO curto.
   * @returns true quando a data e valida.
   */
  private isDataValida(value?: string): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10)
    );
  }

  /**
   * Identifica violacoes de unicidade sem expor detalhes internos do banco.
   * @param error Erro lancado pelo driver PostgreSQL.
   * @returns true quando o erro representa uma constraint unique violada.
   */
  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
