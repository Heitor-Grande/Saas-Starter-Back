import { NotFoundException } from '@nestjs/common';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { mockResponse } from '../../test/helpers/http-mock';
import { MeuUsuarioController } from './meu-usuario.controller';

describe('Controller de consulta do usuário autenticado', () => {
  const request = {
    jwtPayload: {
      usuarioid: 3,
      organizacaoid: 2,
      datalogin: '2026-10-29T12:00:00.000Z',
    },
    params: { id: '99' },
  } as unknown as JwtAuthenticatedRequest;
  const findById = jest.fn();
  const update = jest.fn();
  const controller = new MeuUsuarioController({ findById, update });
  const { response, status, json } = mockResponse();

  beforeEach(() => jest.clearAllMocks());

  it('deve usar exclusivamente o ID do JWT', async () => {
    const usuario = { id: 3, nome: 'Maria Silva' };
    findById.mockResolvedValueOnce(usuario);

    await controller.findAuthenticated(request, response);

    expect(findById).toHaveBeenCalledWith(3);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Usuário consultado com sucesso.',
      data: usuario,
    });
  });

  it('deve retornar 404 quando o usuário não existe', async () => {
    findById.mockRejectedValueOnce(
      new NotFoundException('Usuário não encontrado.'),
    );

    await controller.findAuthenticated(request, response);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('deve ocultar detalhes internos quando a consulta falha', async () => {
    findById.mockRejectedValueOnce(new Error('Erro interno do PostgreSQL'));

    await controller.findAuthenticated(request, response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro ao consultar o usuário.',
      data: null,
    });
  });

  it('deve atualizar o usuário usando exclusivamente o ID do JWT', async () => {
    const body = {
      nome: 'Maria Souza',
      cpf: '12345678900',
      datanascimento: '1990-01-01',
      email: 'maria@example.com',
      telefone: '11999999999',
      ativo: true,
    };
    const usuario = { id: 3, ...body };
    update.mockResolvedValueOnce(usuario);

    await controller.updateAuthenticated(body, request, response);

    expect(update).toHaveBeenCalledWith(3, body);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Usuário atualizado com sucesso.',
      data: usuario,
    });
  });
});
