import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Req,
  Res,
  Put,
} from '@nestjs/common';
import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { createApiResponse } from '../../util/api-response/api-response';
import { MeuUsuarioService } from './meu-usuario.service';
import type { UpdateMeuUsuarioDto } from './dto/update-meu-usuario.dto';

@Controller('meu-usuario')
export class MeuUsuarioController {
  constructor(private readonly service: MeuUsuarioService) {}

  /** Retorna os dados do usuário cujo ID foi extraído do JWT validado. */
  @Get()
  async findAuthenticated(
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuario = await this.service.findById(request.jwtPayload.usuarioid);

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Usuário consultado com sucesso.',
            HttpStatus.OK,
            usuario,
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
            'Erro ao consultar o usuário.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /** Atualiza os campos editáveis do usuário identificado pelo JWT. */
  @Put()
  async updateAuthenticated(
    @Body() body: UpdateMeuUsuarioDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuario = await this.service.update(
        request.jwtPayload.usuarioid,
        body,
      );

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Usuário atualizado com sucesso.',
            HttpStatus.OK,
            usuario,
          ),
        );
    } catch (error) {
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
            'Erro ao atualizar o usuário.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
