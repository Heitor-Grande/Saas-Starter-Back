import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { CarregaPermissoesUsuarioController } from './carrega-permissoes-usuario.controller';

describe('Controller de carregamento de permissões do usuário', () => {
  const request = {
    jwtPayload: {
      usuarioid: 3,
      organizacaoid: 2,
      datalogin: '2026-10-15T12:00:00.000Z',
    },
    query: { usuarioid: '99' },
  } as unknown as JwtAuthenticatedRequest;
  const carregar = jest.fn();
  const controller = new CarregaPermissoesUsuarioController({
    carregar,
  });
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve usar o usuário do JWT e retornar as permissões no formato solicitado', async () => {
    const permissoes = [
      { permissão: 'AcessoMinhaOrganização', temacesso: true },
    ];
    carregar.mockResolvedValueOnce(permissoes);

    await controller.carregar(request, response);

    expect(carregar).toHaveBeenCalledWith(3);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Permissões do usuário carregadas com sucesso.',
      data: permissoes,
    });
  });

  it('deve retornar 404 quando o usuário do token não existe mais', async () => {
    carregar.mockRejectedValueOnce(
      new NotFoundException('Usuário não encontrado.'),
    );

    await controller.carregar(request, response);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Usuário não encontrado.',
      data: null,
    });
  });

  it('deve ocultar detalhes internos quando o banco falha', async () => {
    carregar.mockRejectedValueOnce(
      new Error('Detalhes internos do PostgreSQL'),
    );

    await controller.carregar(request, response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro ao carregar permissões do usuário.',
      data: null,
    });
  });
});
