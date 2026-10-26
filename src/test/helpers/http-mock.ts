import type { Response } from 'express';

/** Cria uma resposta HTTP falsa reutilizável pelos testes de controllers. */
export function mockResponse(): {
  response: Response;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  return {
    response: { status } as unknown as Response,
    status,
    json,
  };
}
