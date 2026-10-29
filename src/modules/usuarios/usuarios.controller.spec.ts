import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { mockResponse } from '../../test/helpers/http-mock';
import { UsuariosController } from './usuarios.controller';

describe('Controller de usuários', () => {
  const request = {
    jwtPayload: {
      usuarioid: 3,
      organizacaoid: 2,
      datalogin: '2026-10-29T12:00:00.000Z',
    },
  } as unknown as JwtAuthenticatedRequest;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new UsuariosController(service);
  const { response, status } = mockResponse();

  beforeEach(() => jest.clearAllMocks());

  it('deve criar usando organização e executor do JWT', async () => {
    const body = { nome: 'Maria' } as never;
    service.create.mockResolvedValueOnce({ id: 5 });
    await controller.create(body, request, response);
    expect(service.create).toHaveBeenCalledWith(2, 3, body);
    expect(status).toHaveBeenCalledWith(201);
  });

  it('deve listar usando a organização do JWT', async () => {
    service.findAll.mockResolvedValueOnce([]);
    await controller.findAll(request, response);
    expect(service.findAll).toHaveBeenCalledWith(2);
  });

  it('deve abrir usuário por ID dentro da organização do JWT', async () => {
    service.findOne.mockResolvedValueOnce({ id: 5 });
    await controller.findOne('5', request, response);
    expect(service.findOne).toHaveBeenCalledWith(5, 2);
  });

  it('deve atualizar usando organização e executor do JWT', async () => {
    const body = { nome: 'Maria' } as never;
    service.update.mockResolvedValueOnce({ id: 5 });
    await controller.update('5', body, request, response);
    expect(service.update).toHaveBeenCalledWith(5, 2, 3, body);
  });

  it('deve excluir usando organização e executor do JWT', async () => {
    service.remove.mockResolvedValueOnce(undefined);
    await controller.remove('5', request, response);
    expect(service.remove).toHaveBeenCalledWith(5, 2, 3);
  });
});
