import {
  BadRequestException,
  Body,
  ConflictException,
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
import type { UpdateMinhaOrganizacaoDto } from './dto/minha-organizacao.dto';
import { MinhaOrganizacaoService } from './minha-organizacao.service';

@Controller('minha-organizacao')
export class MinhaOrganizacaoController {
  constructor(private readonly service: MinhaOrganizacaoService) {}

  @Get()
  async findAuthenticated(
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const organizacao = await this.service.findById(
        request.jwtPayload.organizacaoid,
      );
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Organização consultada com sucesso.',
            HttpStatus.OK,
            organizacao,
          ),
        );
    } catch (error) {
      return this.handleError(error, response, 'consultar');
    }
  }

  @Put()
  async updateAuthenticated(
    @Body() body: UpdateMinhaOrganizacaoDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const organizacao = await this.service.update(
        request.jwtPayload.organizacaoid,
        request.jwtPayload.usuarioid,
        body,
      );
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Organização atualizada com sucesso.',
            HttpStatus.OK,
            organizacao,
          ),
        );
    } catch (error) {
      return this.handleError(error, response, 'atualizar');
    }
  }

  private handleError(
    error: unknown,
    response: Response,
    operacao: 'consultar' | 'atualizar',
  ): Response {
    if (error instanceof BadRequestException) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json(createApiResponse(error.message, HttpStatus.BAD_REQUEST, null));
    }
    if (error instanceof NotFoundException) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .json(createApiResponse(error.message, HttpStatus.NOT_FOUND, null));
    }
    if (error instanceof ConflictException) {
      return response
        .status(HttpStatus.CONFLICT)
        .json(createApiResponse(error.message, HttpStatus.CONFLICT, null));
    }
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        createApiResponse(
          `Erro ao ${operacao} a organização.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
          null,
        ),
      );
  }
}
