import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { createApiResponse } from '../../util/api-response/api-response';
import { ConfiguracaoGlobalService } from './configuracao-global.service';
import type { UpdateConfiguracaoGlobalDto } from './dto/configuracao-global.dto';

@Controller('configuracao-global')
export class ConfiguracaoGlobalController {
  /** Recebe o serviço responsável pela configuração global. */
  constructor(private readonly service: ConfiguracaoGlobalService) {}

  /** Retorna a configuração global de id 1. */
  @Get()
  async findOne(@Res() response: Response): Promise<Response> {
    try {
      const configuracao = await this.service.findOne();
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Configuração global consultada com sucesso.',
            HttpStatus.OK,
            configuracao,
          ),
        );
    } catch (error) {
      if (error instanceof NotFoundException)
        return response
          .status(HttpStatus.NOT_FOUND)
          .json(createApiResponse(error.message, HttpStatus.NOT_FOUND, null));
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar configuração global.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /** Atualiza a configuração global de id 1 e registra a auditoria. */
  @Put()
  async update(
    @Body() body: UpdateConfiguracaoGlobalDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const configuracao = await this.service.update(
        body,
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Configuração global atualizada com sucesso.',
            HttpStatus.OK,
            configuracao,
          ),
        );
    } catch (error) {
      if (error instanceof BadRequestException)
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json(createApiResponse(error.message, HttpStatus.BAD_REQUEST, null));
      if (error instanceof NotFoundException)
        return response
          .status(HttpStatus.NOT_FOUND)
          .json(createApiResponse(error.message, HttpStatus.NOT_FOUND, null));
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao atualizar configuração global.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
