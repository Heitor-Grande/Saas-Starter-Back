import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { LoginRequestDto } from './dto/login.dto';
import { LoginController } from './login.controller';
import type { LoginService } from './login.service';

describe('Controller de login', () => {
  const dto: LoginRequestDto = {
    email: 'maria@example.com',
    senha: 'Senha-segura1!',
  };

  it('deve retornar token ao autenticar usuario', async () => {
    const loginResult = { token: 'token-jwt' };
    const login = jest.fn().mockResolvedValue(loginResult);
    const service = { login } as unknown as LoginService;
    const responseMock = createResponseMock();
    const controller = new LoginController(service);

    await controller.login(dto, responseMock.response);

    expect(login).toHaveBeenCalledWith(dto);
    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(responseMock.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.OK,
      message: 'Login realizado com sucesso.',
      data: loginResult,
    });
  });

  it('deve retornar erro de validacao quando credenciais forem incompletas', async () => {
    const login = jest
      .fn()
      .mockRejectedValue(
        new BadRequestException('O e-mail informado é inválido.'),
      );
    const service = { login } as unknown as LoginService;
    const responseMock = createResponseMock();
    const controller = new LoginController(service);

    await controller.login(dto, responseMock.response);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(responseMock.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'O e-mail informado é inválido.',
      data: null,
    });
  });

  it('deve retornar nao autorizado quando credenciais forem invalidas', async () => {
    const login = jest
      .fn()
      .mockRejectedValue(
        new UnauthorizedException('E-mail ou senha inválidos.'),
      );
    const service = { login } as unknown as LoginService;
    const responseMock = createResponseMock();
    const controller = new LoginController(service);

    await controller.login(dto, responseMock.response);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(responseMock.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'E-mail ou senha inválidos.',
      data: null,
    });
  });
});

/**
 * Cria um mock encadeavel de resposta HTTP para testar o controller.
 * @returns Um objeto com os metodos status e json monitorados pelo Jest.
 */
function createResponseMock(): {
  response: Response;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;

  return { response, status, json };
}
