import { Controller, Get, HttpStatus, Res, SetMetadata } from '@nestjs/common';
import type { Response } from 'express';
import { PERMISSAO_NECESSARIA_KEY } from '../../guards/permissao/permissao.guard';
import { createApiResponse } from '../../util/api-response/api-response';
import { LogService } from './log.service';

@SetMetadata(PERMISSAO_NECESSARIA_KEY, 'VisualizaLogsAuditoria')
@Controller('log')
export class LogController {
  /**
   * Recebe o serviço responsável pela consulta do histórico de auditoria.
   * @param logService Serviço de logs fornecido pelo NestJS.
   * @returns Uma instância do controller de logs.
   */
  constructor(private readonly logService: LogService) {}

  /**
   * Retorna todos os registros existentes no histórico de auditoria.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com os registros encontrados ou uma mensagem de erro.
   */
  @Get('/findAll')
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const logs = await this.logService.findAll();

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Logs consultados com sucesso.',
            HttpStatus.OK,
            logs,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar logs.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
