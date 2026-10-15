import {
  BadRequestException,
  Body,
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
  SetMetadata,
} from '@nestjs/common';
import type { Response } from 'express';
import { PERMISSAO_NECESSARIA_KEY } from '../../guards/permissao/permissao.guard';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { createApiResponse } from '../../util/api-response/api-response';
import type { CreatePermissaoDto } from './dto/create-permissao.dto';
import type { UpdatePermissaoDto } from './dto/update-permissao.dto';
import { PermissoesService } from './permissoes.service';

@SetMetadata(PERMISSAO_NECESSARIA_KEY, 'VisualizaPermissões')
@Controller('permissoes')
export class PermissoesController {
  /**
   * Recebe o serviço responsável pelas operações de permissões.
   * @param permissoesService Serviço de permissões fornecido pelo NestJS.
   * @returns Uma instância do controller de permissões.
   */
  constructor(private readonly permissoesService: PermissoesService) {}

  /**
   * Cria uma permissão vinculada ao usuário autenticado pelo JWT.
   * @param body Nome e descrição recebidos na requisição.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a permissão criada ou o erro encontrado.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'CriaPermissao')
  @Post('/create')
  async create(
    @Body() body: CreatePermissaoDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuarioId = request.jwtPayload.usuarioid;
      await this.permissoesService.create(body, usuarioId);

      return response
        .status(HttpStatus.CREATED)
        .json(
          createApiResponse(
            'Permissão criada com sucesso.',
            HttpStatus.CREATED,
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
            'Erro ao criar permissão.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Consulta uma única permissão pelo identificador informado.
   * @param id Identificador da permissão recebido na URL.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a permissão encontrada ou o erro.
   */
  @Get('/findOne/:id')
  async findOne(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const permissao = await this.permissoesService.findOne(Number(id));

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Permissão consultada com sucesso.',
            HttpStatus.OK,
            permissao,
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
            'Erro ao consultar permissão.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Lista todas as permissões cadastradas para consulta.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a lista de permissões ou o erro.
   */
  @Get('/findAll')
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const permissoes = await this.permissoesService.findAll();

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Permissões consultadas com sucesso.',
            HttpStatus.OK,
            permissoes,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar permissões.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Atualiza uma permissão e registra o usuário autenticado como responsável.
   * @param id Identificador da permissão recebido na URL.
   * @param body Nome e descrição atualizados recebidos na requisição.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a confirmação da atualização ou o erro.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'AtualizaPermissao')
  @Put('/update/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePermissaoDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.permissoesService.update(
        Number(id),
        body,
        request.jwtPayload.usuarioid,
      );

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse('Permissão atualizada com sucesso.', HttpStatus.OK),
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
            'Erro ao atualizar permissão.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Exclui uma permissão e seus vínculos existentes com perfis.
   * @param id Identificador da permissão recebido na URL.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a confirmação da exclusão ou o erro.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'DeletaPermissao')
  @Delete('/remove/:id')
  async remove(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.permissoesService.remove(Number(id));

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse('Permissão excluída com sucesso.', HttpStatus.OK),
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
            'Erro ao excluir permissão.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
