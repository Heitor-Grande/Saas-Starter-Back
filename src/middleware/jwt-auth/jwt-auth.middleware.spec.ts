import type { NextFunction, Request, Response } from 'express';
import { generateJwt } from '../../util/jwt/jwt';
import {
  JwtAuthMiddleware,
  type JwtAuthenticatedRequest,
} from './jwt-auth.middleware';

describe('Middleware de autenticação JWT', () => {
  const middleware = new JwtAuthMiddleware();

  it('deve prosseguir quando o JWT for válido', () => {
    const token = generateJwt(
      {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
      60,
    );
    const request = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const response = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((request as JwtAuthenticatedRequest).jwtPayload).toMatchObject({
      usuarioid: 1,
      datalogin: '2026-10-10T12:00:00.000Z',
      organizacaoid: 2,
    });
  });

  it('deve retornar erro quando o JWT for inválido', () => {
    const request = {
      headers: { authorization: 'Bearer token-invalido' },
    } as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(request, response, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Token JWT ausente ou inválido.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o usuário do payload for inválido', () => {
    const token = generateJwt(
      {
        usuarioid: 0,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
      60,
    );
    const request = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(request, response, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Usuário do token JWT inválido.',
      data: null,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
