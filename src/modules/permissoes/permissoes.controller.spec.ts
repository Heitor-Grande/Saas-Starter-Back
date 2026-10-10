import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import type { PermissaoDto } from './dto/create-permissao.dto';
import { PermissoesController } from './permissoes.controller';
import { PermissoesService } from './permissoes.service';

describe('Controller de permissões', () => {
  it('deve criar uma permissão para o usuário autenticado', async () => {
    const permissao: PermissaoDto = {
      id: 10,
      nome: 'Criar usuário',
      descricao: 'Permite criar novos usuários',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const create = jest.fn().mockResolvedValue(permissao);
    const service = { create } as unknown as PermissoesService;
    const controller = new PermissoesController(service);
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.create(
      {
        nome: 'Criar usuário',
        descricao: 'Permite criar novos usuários',
      },
      request,
      response,
    );

    expect(create).toHaveBeenCalledWith(
      {
        nome: 'Criar usuário',
        descricao: 'Permite criar novos usuários',
      },
      1,
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      statusCode: 201,
      message: 'Permissão criada com sucesso.',
    });
  });

  it('deve consultar uma permissão pelo identificador', async () => {
    const permissao: PermissaoDto = {
      id: 10,
      nome: 'Criar usuário',
      descricao: 'Permite criar novos usuários',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const findOne = jest.fn().mockResolvedValue(permissao);
    const service = { findOne } as unknown as PermissoesService;
    const controller = new PermissoesController(service);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.findOne('10', response);

    expect(findOne).toHaveBeenCalledWith(10);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Permissão consultada com sucesso.',
      data: permissao,
    });
  });

  it('deve listar todas as permissões cadastradas', async () => {
    const permissoes: PermissaoDto[] = [];
    const findAll = jest.fn().mockResolvedValue(permissoes);
    const service = { findAll } as unknown as PermissoesService;
    const controller = new PermissoesController(service);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.findAll(response);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Permissões consultadas com sucesso.',
      data: permissoes,
    });
  });

  it('deve atualizar uma permissão pelo identificador', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = { update } as unknown as PermissoesService;
    const controller = new PermissoesController(service);
    const request = {
      jwtPayload: {
        usuarioid: 1,
        datalogin: '2026-10-10T12:00:00.000Z',
        organizacaoid: 2,
      },
    } as JwtAuthenticatedRequest;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;
    const body = {
      nome: 'Editar usuário',
      descricao: 'Permite editar usuários',
    };

    await controller.update('10', body, request, response);

    expect(update).toHaveBeenCalledWith(10, body, 1);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Permissão atualizada com sucesso.',
    });
  });

  it('deve excluir uma permissão pelo identificador', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const service = { remove } as unknown as PermissoesService;
    const controller = new PermissoesController(service);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.remove('10', response);

    expect(remove).toHaveBeenCalledWith(10);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Permissão excluída com sucesso.',
    });
  });
});
