import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { mockResponse } from '../../test/helpers/http-mock';
import { MinhaOrganizacaoController } from './minha-organizacao.controller';

describe('Controller da organização autenticada', () => {
  const request = {
    jwtPayload: {
      usuarioid: 3,
      organizacaoid: 2,
      datalogin: '2026-10-29T12:00:00.000Z',
    },
  } as unknown as JwtAuthenticatedRequest;
  const findById = jest.fn();
  const update = jest.fn();
  const controller = new MinhaOrganizacaoController({ findById, update });
  const { response, status, json } = mockResponse();

  beforeEach(() => jest.clearAllMocks());

  it('deve consultar usando exclusivamente a organização do JWT', async () => {
    findById.mockResolvedValueOnce({ id: 2 });
    await controller.findAuthenticated(request, response);
    expect(findById).toHaveBeenCalledWith(2);
    expect(status).toHaveBeenCalledWith(200);
  });

  it('deve atualizar usando a organização e o usuário do JWT', async () => {
    const body = {
      nome: 'Organização',
      cnpj: '12345678000199',
      planoid: 1,
      usuarioresponsavelid: 3,
      cep: '01000000',
      logradouro: 'Rua Exemplo',
      numero: '100',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
    };
    update.mockResolvedValueOnce({ id: 2, ...body });

    await controller.updateAuthenticated(body, request, response);

    expect(update).toHaveBeenCalledWith(2, 3, body);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 200 }),
    );
  });
});
