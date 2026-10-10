import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createApiResponse } from '../../util/api-response/api-response';
import { validateJwt } from '../../util/jwt/jwt';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  /**
   * Protege a rota permitindo apenas requisições com um JWT válido.
   * @param request Requisição que contém o JWT no cabeçalho Authorization.
   * @param response Resposta usada para informar ao cliente quando o JWT for inválido.
   * @param next Função que encaminha a requisição para a próxima etapa.
   * @returns A resposta de erro ou nenhum conteúdo quando a requisição continuar.
   */
  use(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Response | void {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token || !validateJwt(token)) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          createApiResponse(
            'Token JWT ausente ou inválido.',
            HttpStatus.UNAUTHORIZED,
          ),
        );
    }

    next();
  }
}
