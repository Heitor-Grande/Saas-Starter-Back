import { Controller, Get, HttpStatus, Res, SetMetadata } from '@nestjs/common';
import type { Response } from 'express';
import { PERMISSAO_NECESSARIA_KEY } from '../../guards/permissao/permissao.guard';
import { createApiResponse } from '../../util/api-response/api-response';
import { DashboardAdminService } from './dashboard-admin.service';

@SetMetadata(PERMISSAO_NECESSARIA_KEY, 'VisualizaDashboardAdmin')
@Controller('dashboard-admin')
export class DashboardAdminController {
  /**
   * Recebe o serviço responsável pelos indicadores administrativos.
   * @param dashboardAdminService Serviço do dashboard fornecido pelo NestJS.
   * @returns Uma instância do controller do dashboard administrativo.
   */
  constructor(private readonly dashboardAdminService: DashboardAdminService) {}

  /**
   * Retorna os indicadores gerais usados pelo dashboard administrativo.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com os indicadores ou uma mensagem de erro.
   */
  @Get('/findAll')
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const dashboard = await this.dashboardAdminService.findAll();

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Dashboard administrativo consultado com sucesso.',
            HttpStatus.OK,
            dashboard,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar o dashboard administrativo.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
