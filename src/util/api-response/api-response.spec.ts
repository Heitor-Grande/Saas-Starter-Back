import { createApiResponse } from './api-response';

describe('Utilitário de resposta da API', () => {
  it('deve criar uma resposta sem dados', () => {
    expect(createApiResponse('Não autorizado.', 401)).toEqual({
      statusCode: 401,
      message: 'Não autorizado.',
    });
  });

  it('deve criar uma resposta com dados', () => {
    const data = [{ id: 1, name: 'Usuário' }];

    expect(createApiResponse('Consulta realizada.', 200, data)).toEqual({
      statusCode: 200,
      message: 'Consulta realizada.',
      data,
    });
  });
});
