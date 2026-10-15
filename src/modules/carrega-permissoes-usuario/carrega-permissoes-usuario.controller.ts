import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { createApiResponse } from '../../util/api-response/api-response';
import { CarregaPermissoesUsuarioService } from './carrega-permissoes-usuario.service';

@Controller('carrega-permissoes-usuario')
export class CarregaPermissoesUsuarioController {
  /**
   * Recebe o serviço que consulta as permissões do usuário.
   * @param service Serviço fornecido pelo NestJS.
   * @returns Uma instância do controller.
   */
  constructor(private readonly service: CarregaPermissoesUsuarioService) {}

  /**
   * Carrega as permissões exclusivamente para o usuário autenticado.
   * @param request Requisição com o payload do JWT validado.
   * @param response Resposta HTTP para retornar os dados ou um erro seguro.
   * @returns A resposta padronizada com as permissões e seus acessos.
   */
  @Get()
  async carregar(
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const permissoes = await this.service.carregar(
        request.jwtPayload.usuarioid,
      );

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Permissões do usuário carregadas com sucesso.',
            HttpStatus.OK,
            permissoes,
          ),
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return response
          .status(HttpStatus.NOT_FOUND)
          .json(createApiResponse(error.message, HttpStatus.NOT_FOUND, null));
      }

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao carregar permissões do usuário.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
