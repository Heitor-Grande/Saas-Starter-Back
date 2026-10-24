import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createApiResponse } from '../../util/api-response/api-response';
import { OrganizacoesUsuariosService } from './organizacoes-usuarios.service';

@Controller('organizacoes-usuarios')
export class OrganizacoesUsuariosController {
  /**
   * Recebe o serviço responsável pela consulta de organizações e usuários.
   * @param organizacoesUsuariosService Serviço fornecido pelo NestJS.
   * @returns Uma instância do controller de organizações e usuários.
   */
  constructor(
    private readonly organizacoesUsuariosService: OrganizacoesUsuariosService,
  ) {}

  /**
   * Retorna as organizações e seus usuários em uma estrutura de árvore.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a árvore consultada ou uma mensagem de erro.
   */
  @Get('/findAll')
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const organizacoes = await this.organizacoesUsuariosService.findAll();

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Organizações e usuários consultados com sucesso.',
            HttpStatus.OK,
            organizacoes,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar organizações e usuários.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
