import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { mockConsultas } from '../../test/helpers/postgres-mock';
import * as bcryptUtil from '../../util/bcrypt/bcrypt';
import * as jwtUtil from '../../util/jwt/jwt';
import { LoginService } from './login.service';

describe('Servico de login', () => {
  const service = new LoginService();
  const credenciais = {
    email: 'maria@example.com',
    senha: 'Senha-segura1!',
  };
  const usuarioMock = {
    id: 10,
    email: 'maria@example.com',
    organizacaoid: 20,
    ativo: true,
    senhahash: 'hash-da-senha',
  };

  const mockUsuario = (overrides: Partial<typeof usuarioMock> = {}) =>
    mockConsultas([[{ ...usuarioMock, ...overrides }]]);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve retornar token quando as credenciais forem validas', async () => {
    const query = mockUsuario();
    const validateHash = jest
      .spyOn(bcryptUtil, 'validateHash')
      .mockReturnValue(true);
    const generateJwt = jest
      .spyOn(jwtUtil, 'generateJwt')
      .mockReturnValue('token-jwt');
    const result = await service.login({
      email: ' MARIA@EXAMPLE.COM ',
      senha: 'Senha-segura1!',
    });

    expect(result).toEqual({ token: 'token-jwt' });
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'maria@example.com',
    ]);
    expect(validateHash).toHaveBeenCalledWith(
      'Senha-segura1!',
      'hash-da-senha',
    );
    expect(generateJwt).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioid: 10,
        organizacaoid: 20,
      }),
      Number(process.env.JWT_EXPIRES_IN_SECONDS),
    );
  });

  it('deve rejeitar e-mail invalido antes de consultar o banco', async () => {
    const query = jest.spyOn(postgresPool, 'query');
    await expect(
      service.login({ email: 'email-invalido', senha: 'Senha-segura1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('deve rejeitar corpo ausente antes de consultar o banco', async () => {
    const query = jest.spyOn(postgresPool, 'query');
    await expect(service.login()).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('deve rejeitar senha ausente antes de consultar o banco', async () => {
    const query = jest.spyOn(postgresPool, 'query');
    await expect(
      service.login({ email: 'maria@example.com', senha: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando usuario nao existir', async () => {
    mockConsultas([[]]);

    await expect(service.login(credenciais)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('deve rejeitar quando usuario estiver inativo', async () => {
    mockUsuario({ ativo: false });

    await expect(service.login(credenciais)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('deve rejeitar quando a senha nao conferir com o hash', async () => {
    mockUsuario();
    jest.spyOn(bcryptUtil, 'validateHash').mockReturnValue(false);
    await expect(
      service.login({ email: 'maria@example.com', senha: 'senha-incorreta' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
