import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { generateHash, validateHash } from '../../util/bcrypt/bcrypt';
import { signJwtPayload, verifyJwtPayload } from '../../util/jwt/jwt';
import { descriptografar } from '../../util/nodeCrypto/nodeCrypto';
import { validarForcaSenha } from '../../util/validar-forca-senha/validar-forca-senha';
import type {
  RedefinirSenhaDto,
  SolicitarRecuperacaoSenhaDto,
  TokenRecuperacaoResponseDto,
  ValidarCodigoRecuperacaoDto,
} from './dto/recuperacao-senha.dto';

type UsuarioRecuperacao = {
  id: number;
  email: string;
  organizacaoid: number;
  senhahash: string;
  ativo: boolean;
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

type TokenCodigo = JsonWebTokenPayload & {
  finalidade: 'recuperacao-codigo';
  usuarioid: number;
  organizacaoid: number;
  codigoHash: string;
};

type TokenRedefinicao = JsonWebTokenPayload & {
  finalidade: 'recuperacao-redefinir';
  usuarioid: number;
  organizacaoid: number;
  senhaVersao: string;
};

@Injectable()
export class RecuperacaoSenhaService {
  private readonly validadeSegundos = Math.max(
    60,
    Number(process.env.RECUPERACAO_SENHA_JWT_EXPIRES_IN_SECONDS) || 600,
  );

  async solicitar(
    dto: SolicitarRecuperacaoSenhaDto,
  ): Promise<TokenRecuperacaoResponseDto> {
    const email = dto?.email?.trim().toLowerCase();
    if (!email || email.length > 100 || !email.includes('@')) {
      throw new BadRequestException('O e-mail informado é inválido.');
    }

    const result = await postgresPool.query<UsuarioRecuperacao>(
      `SELECT id, email, organizacaoid, senhahash, ativo
       FROM usuarios WHERE email = $1 LIMIT 1`,
      [email],
    );
    const usuario = result.rows[0];
    const codigo = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codigoHash = generateHash(codigo, this.obterSaltRounds()).hash;
    const token = signJwtPayload<TokenCodigo>(
      {
        finalidade: 'recuperacao-codigo',
        usuarioid: usuario?.ativo ? usuario.id : 0,
        organizacaoid: usuario?.ativo ? usuario.organizacaoid : 0,
        codigoHash,
      },
      this.validadeSegundos,
    );

    if (usuario?.ativo) await this.enviarCodigo(usuario.email, codigo);
    return { token, expiraEmSegundos: this.validadeSegundos };
  }

  async validarCodigo(
    dto: ValidarCodigoRecuperacaoDto,
  ): Promise<TokenRecuperacaoResponseDto> {
    const codigo = dto?.codigo?.trim();
    const payload = dto?.token
      ? verifyJwtPayload<TokenCodigo>(dto.token)
      : null;
    if (
      !payload ||
      payload.finalidade !== 'recuperacao-codigo' ||
      !/^\d{6}$/.test(codigo || '') ||
      payload.usuarioid <= 0 ||
      !validateHash(codigo!, payload.codigoHash)
    ) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    const usuario = await this.buscarUsuario(payload.usuarioid);
    const token = signJwtPayload<TokenRedefinicao>(
      {
        finalidade: 'recuperacao-redefinir',
        usuarioid: usuario.id,
        organizacaoid: usuario.organizacaoid,
        senhaVersao: this.versaoSenha(usuario.senhahash),
      },
      this.validadeSegundos,
    );
    return { token, expiraEmSegundos: this.validadeSegundos };
  }

  async redefinir(dto: RedefinirSenhaDto): Promise<void> {
    if (!validarForcaSenha(dto?.senha)) {
      throw new BadRequestException(
        'A senha deve ter no mínimo 5 caracteres, 1 número, 1 letra maiúscula e 1 caractere especial.',
      );
    }
    if (dto.senha !== dto.confirmarSenha) {
      throw new BadRequestException('A confirmação da senha não confere.');
    }

    const payload = dto?.token
      ? verifyJwtPayload<TokenRedefinicao>(dto.token)
      : null;
    if (!payload || payload.finalidade !== 'recuperacao-redefinir') {
      throw new UnauthorizedException('Autorização inválida ou expirada.');
    }

    const usuario = await this.buscarUsuario(payload.usuarioid);
    if (this.versaoSenha(usuario.senhahash) !== payload.senhaVersao) {
      throw new UnauthorizedException(
        'Este link de recuperação já foi utilizado.',
      );
    }
    const senha = generateHash(dto.senha, this.obterSaltRounds());
    await postgresPool.query(
      `UPDATE usuarios SET senhahash = $1, saltroundsenha = $2
       WHERE id = $3 AND ativo = true`,
      [senha.hash, senha.saltRounds, usuario.id],
    );
  }

  private async buscarUsuario(id: number): Promise<UsuarioRecuperacao> {
    const result = await postgresPool.query<UsuarioRecuperacao>(
      `SELECT id, email, organizacaoid, senhahash, ativo
       FROM usuarios WHERE id = $1 AND ativo = true LIMIT 1`,
      [id],
    );
    if (!result.rows[0]) {
      throw new UnauthorizedException('Autorização inválida ou expirada.');
    }
    return result.rows[0];
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
      subject: `${codigo} é o seu código de recuperação`,
      text: `Seu código de recuperação de senha é ${codigo}. Ele expira em ${Math.ceil(this.validadeSegundos / 60)} minutos.`,
      html: `<p>Seu código de recuperação de senha é:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p><p>Ele expira em ${Math.ceil(this.validadeSegundos / 60)} minutos.</p>`,
    });
  }

  private obterSaltRounds(): number {
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS);
    if (!Number.isInteger(rounds) || rounds < 4 || rounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS deve ser um número entre 4 e 15.');
    }
    return rounds;
  }

  private versaoSenha(hash: string): string {
    return createHash('sha256').update(hash).digest('base64url');
  }
}
