import { mockResponse } from '../../test/helpers/http-mock';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import type { PerfilDetalhadoDto, PerfilDto } from './dto/create-perfil.dto';
import { PerfisController } from './perfis.controller';
import { PerfisService } from './perfis.service';

describe('Controller de perfis', () => {
  it('deve criar um perfil para o usuário autenticado', async () => {
    const perfil: PerfilDto = {
      id: 10,
      nome: 'Administrador',
      descricao: 'Acesso administrativo',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const create = jest.fn().mockResolvedValue(perfil);
    const service = { create } as unknown as PerfisService;
    const controller = new PerfisController(service);
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;
    const { response, status, json } = mockResponse();

    await controller.create(
      {
        nome: 'Administrador',
        descricao: 'Acesso administrativo',
      },
      request,
      response,
    );

    expect(create).toHaveBeenCalledWith(
      {
        nome: 'Administrador',
        descricao: 'Acesso administrativo',
      },
      1,
      2,
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      statusCode: 201,
      message: 'Perfil criado com sucesso.',
      data: perfil,
    });
  });

  it('deve consultar um perfil pelo identificador', async () => {
    const perfil: PerfilDetalhadoDto = {
      id: 10,
      nome: 'Administrador',
      descricao: 'Acesso administrativo',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
      permissoesids: [2, 4],
    };
    const findOne = jest.fn().mockResolvedValue(perfil);
    const controller = new PerfisController({
      findOne,
    } as unknown as PerfisService);
    const { response, json } = mockResponse();

    await controller.findOne('10', response);

    expect(findOne).toHaveBeenCalledWith(10);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Perfil consultado com sucesso.',
      data: perfil,
    });
  });

  it('deve listar todos os perfis cadastrados', async () => {
    const findAll = jest.fn().mockResolvedValue([]);
    const controller = new PerfisController({
      findAll,
    } as unknown as PerfisService);
    const { response, json } = mockResponse();

    await controller.findAll(response);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Perfis consultados com sucesso.',
      data: [],
    });
  });

  it('deve atualizar um perfil pelo identificador', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const controller = new PerfisController({
      update,
    } as unknown as PerfisService);
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;
    const { response, json } = mockResponse();
    const body = { nome: 'Gestor', descricao: 'Acesso de gestão' };

    await controller.update('10', body, request, response);

    expect(update).toHaveBeenCalledWith(10, body, 1, 2);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Perfil atualizado com sucesso.',
    });
  });

  it('deve excluir um perfil pelo identificador', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const controller = new PerfisController({
      remove,
    } as unknown as PerfisService);
    const { response, json } = mockResponse();
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;

    await controller.remove('10', request, response);

    expect(remove).toHaveBeenCalledWith(10, 1, 2);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Perfil excluído com sucesso.',
    });
  });

  it('deve associar permissões ao perfil', async () => {
    const associatePermissions = jest.fn().mockResolvedValue(undefined);
    const service = { associatePermissions } as unknown as PerfisService;
    const controller = new PerfisController(service);
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;
    const { response, status, json } = mockResponse();

    await controller.associatePermissions(
      '10',
      { permissoesIds: [1, 2] },
      request,
      response,
    );

    expect(associatePermissions).toHaveBeenCalledWith(
      10,
      { permissoesIds: [1, 2] },
      1,
      2,
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      statusCode: 201,
      message: 'Permissões associadas ao perfil com sucesso.',
    });
  });

  it('deve remover um vínculo entre permissão e perfil', async () => {
    const removePermissions = jest.fn().mockResolvedValue(undefined);
    const service = { removePermissions } as unknown as PerfisService;
    const controller = new PerfisController(service);
    const { response, status, json } = mockResponse();
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;

    await controller.removePermissions('10', '2', request, response);

    expect(removePermissions).toHaveBeenCalledWith(10, 2, 1, 2);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Vínculo entre perfil e permissão removido com sucesso.',
    });
  });
});
