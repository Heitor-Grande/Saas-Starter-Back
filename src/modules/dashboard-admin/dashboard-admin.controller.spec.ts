import type { Response } from 'express';
import { DashboardAdminController } from './dashboard-admin.controller';

describe('Controller do dashboard administrativo', () => {
  it('deve retornar os indicadores administrativos', async () => {
    const dashboard = {
      totalusuarios: 12,
      usuariosinativos: 3,
      totalorganizacoes: 2,
      usuariospororganizacao: [],
      usuariosporperfil: [],
    };
    const findAll = jest.fn().mockResolvedValue(dashboard);
    const controller = new DashboardAdminController({ findAll });
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.findAll(response);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Dashboard administrativo consultado com sucesso.',
      data: dashboard,
    });
  });

  it('deve retornar erro interno sem expor detalhes da consulta', async () => {
    const findAll = jest.fn().mockRejectedValue(new Error('erro do banco'));
    const controller = new DashboardAdminController({ findAll });
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;

    await controller.findAll(response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro ao consultar o dashboard administrativo.',
      data: null,
    });
  });
});
