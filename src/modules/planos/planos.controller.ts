import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { createApiResponse } from '../../util/api-response/api-response';
import type { CreatePlanoDto } from './dto/create-plano.dto';
import type { UpdatePlanoDto } from './dto/update-plano.dto';
import { PlanosService } from './planos.service';

@Controller('planos')
export class PlanosController {
  /** Recebe o serviço responsável pelas operações de planos. */
  constructor(private readonly planosService: PlanosService) {}

  /** Cria um plano usando o usuário autenticado para auditoria. */
  @Post('/create')
  async create(
    @Body() body: CreatePlanoDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const plano = await this.planosService.create(
        body,
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );
      return response
        .status(HttpStatus.CREATED)
        .json(
          createApiResponse(
            'Plano criado com sucesso.',
            HttpStatus.CREATED,
            plano,
          ),
        );
    } catch (error) {
      if (error instanceof BadRequestException) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json(createApiResponse(error.message, HttpStatus.BAD_REQUEST, null));
      }

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao criar plano.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /** Consulta um plano pelo identificador informado. */
  @Get('/findOne/:id')
  async findOne(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const plano = await this.planosService.findOne(Number(id));
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Plano consultado com sucesso.',
            HttpStatus.OK,
            plano,
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

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar plano.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /** Lista todos os planos cadastrados. */
  @Get('/findAll')
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const planos = await this.planosService.findAll();
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Planos consultados com sucesso.',
            HttpStatus.OK,
            planos,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar planos.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /** Atualiza um plano usando o usuário autenticado para auditoria. */
  @Put('/update/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePlanoDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const plano = await this.planosService.update(
        Number(id),
        body,
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Plano atualizado com sucesso.',
            HttpStatus.OK,
            plano,
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

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao atualizar plano.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /** Exclui um plano usando o usuário autenticado para auditoria. */
  @Delete('/remove/:id')
  async remove(
    @Param('id') id: string,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.planosService.remove(
        Number(id),
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );
      return response
        .status(HttpStatus.OK)
        .json(createApiResponse('Plano excluído com sucesso.', HttpStatus.OK));
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

      console.log(error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao excluir plano.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
