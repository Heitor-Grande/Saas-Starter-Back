import type { Response } from 'express';
import { OrganizacoesUsuariosController } from './organizacoes-usuarios.controller';

describe('Controller de organizações e usuários', () => {
  it('deve retornar a árvore de organizações e usuários', async () => {
    const organizacoes = [
      {
        id: 1,
        nome: 'Empresa Alpha',
        plano: 'Growth',
        usuarios: [
          { id: 10, nome: 'Ana Silva', perfil: 'Administrador', ativo: true },
        ],
      },
    ];
    const findAll = jest.fn().mockResolvedValue(organizacoes);
    const controller = new OrganizacoesUsuariosController({
      findAll,
    });
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.findAll(response);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Organizações e usuários consultados com sucesso.',
      data: organizacoes,
    });
  });

  it('deve retornar erro interno sem expor detalhes da consulta', async () => {
    const findAll = jest.fn().mockRejectedValue(new Error('erro do banco'));
    const controller = new OrganizacoesUsuariosController({
      findAll,
    });
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.findAll(response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro ao consultar organizações e usuários.',
      data: null,
    });
  });
});
