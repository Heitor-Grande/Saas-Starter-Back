import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { validateHash } from '../../util/bcrypt/bcrypt';
import { generateJwt } from '../../util/jwt/jwt';
import type {
  LoginRequestDto,
  LoginResponseDto,
  LoginUsuarioDto,
} from './dto/login.dto';

@Injectable()
export class LoginService {
  /**
   * Valida credenciais do usuario e gera um JWT para autenticar novas requisicoes.
   * @param dto E-mail e senha informados pelo usuario na tela de login.
   * @returns O token JWT que deve ser armazenado no cookie do navegador pelo cliente.
   */
  async login(dto?: LoginRequestDto): Promise<LoginResponseDto> {
    const email = dto?.email?.trim().toLowerCase();
    const senha = dto?.senha;

    if (!email || email.length > 100 || !email.includes('@')) {
      throw new BadRequestException('O e-mail informado é inválido.');
    }

    if (!senha) {
      throw new BadRequestException('A senha deve ser informada.');
    }

    if (process.env.JWT_EXPIRES_IN_SECONDS === undefined) {
      throw new BadRequestException(`
        A variável de ambiente JWT_EXPIRES_IN_SECONDS não está definida.
        `);
    }

    const result = await postgresPool.query<LoginUsuarioDto>(
      `SELECT
        id,
        email,
        organizacaoid,
        ativo,
        senhahash
      FROM usuarios
      WHERE email = $1
      LIMIT 1`,
      [email],
    );
    const usuario = result.rows[0];

    if (!usuario || !usuario.ativo || !validateHash(senha, usuario.senhahash)) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const token = generateJwt(
      {
        usuarioid: usuario.id,
        datalogin: new Date().toISOString(),
        organizacaoid: usuario.organizacaoid,
      },
      Number(process.env.JWT_EXPIRES_IN_SECONDS),
    );

    return { token };
  }
}
