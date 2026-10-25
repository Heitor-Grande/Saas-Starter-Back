import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { PlanosController } from './planos.controller';
import { PlanosService } from './planos.service';

const request = {
  jwtPayload: {
    usuarioid: 2,
    organizacaoid: 3,
    datalogin: '2026-10-25T12:00:00.000Z',
  },
} as JwtAuthenticatedRequest;

/** Cria a resposta HTTP falsa usada para validar status e conteúdo. */
function criarResponse(): {
  response: Response;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { response: { status } as unknown as Response, status, json };
}

describe('Controller de planos', () => {
  it.each([
    [new BadRequestException('O plano informado é inválido.'), 400],
    [new NotFoundException('Plano não encontrado.'), 404],
    [
      new ConflictException(
        'O plano não pode ser excluído porque está vinculado a organizações.',
      ),
      409,
    ],
  ])(
    'deve retornar o erro conhecido ao excluir um plano',
    async (error, code) => {
      const remove = jest.fn().mockRejectedValue(error);
      const controller = new PlanosController({
        remove,
      } as unknown as PlanosService);
      const { response, status, json } = criarResponse();

      await controller.remove('10', request, response);

      expect(remove).toHaveBeenCalledWith(10, 2, 3);
      expect(status).toHaveBeenCalledWith(code);
      expect(json).toHaveBeenCalledWith({
        statusCode: code,
        message: error.message,
        data: null,
      });
    },
  );

  it('deve ocultar detalhes de erros inesperados ao excluir', async () => {
    const controller = new PlanosController({
      remove: jest.fn().mockRejectedValue(new Error('detalhe interno')),
    } as unknown as PlanosService);
    const { response, status, json } = criarResponse();

    await controller.remove('10', request, response);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro ao excluir plano.',
      data: null,
    });
  });
});
