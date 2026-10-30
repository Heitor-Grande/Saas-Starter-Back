import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createApiResponse } from '../../util/api-response/api-response';
import { PlanosPublicosService } from './planos-publicos.service';

@Controller('planos-publicos')
export class PlanosPublicosController {
  constructor(private readonly service: PlanosPublicosService) {}

  @Get()
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const planos = await this.service.findAll();
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Planos disponíveis consultados com sucesso.',
            HttpStatus.OK,
            planos,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar os planos disponíveis.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
