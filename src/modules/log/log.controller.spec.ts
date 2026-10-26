import { mockResponse } from '../../test/helpers/http-mock';
import { LogController } from './log.controller';

describe('Controller de logs', () => {
  it('deve retornar os registros de auditoria', async () => {
    const logs = [{ id: 1, acao: 'POST' }];
    const findAll = jest.fn().mockResolvedValue(logs);
    const controller = new LogController({ findAll });
    const { response, status, json } = mockResponse();

    await controller.findAll(response);

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      statusCode: 200,
      message: 'Logs consultados com sucesso.',
      data: logs,
    });
  });

  it('deve retornar erro interno sem expor detalhes da consulta', async () => {
    const findAll = jest.fn().mockRejectedValue(new Error('erro do banco'));
    const controller = new LogController({ findAll });
    const { response, status, json } = mockResponse();

    await controller.findAll(response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro ao consultar logs.',
      data: null,
    });
  });
});
