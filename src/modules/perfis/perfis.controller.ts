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
  SetMetadata,
} from '@nestjs/common';
import type { Response } from 'express';
import { PERMISSAO_NECESSARIA_KEY } from '../../guards/permissao/permissao.guard';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { createApiResponse } from '../../util/api-response/api-response';
import type { AssociatePermissoesDto } from './dto/associate-permissoes.dto';
import type { CreatePerfilDto } from './dto/create-perfil.dto';
import type { UpdatePerfilDto } from './dto/update-perfil.dto';
import { PerfisService } from './perfis.service';

@SetMetadata(PERMISSAO_NECESSARIA_KEY, 'VisualizaPerfis')
@Controller('perfis')
export class PerfisController {
  /**
   * Recebe o serviço responsável pelas operações de perfis.
   * @param perfisService Serviço de perfis fornecido pelo NestJS.
   * @returns Uma instância do controller de perfis.
   */
  constructor(private readonly perfisService: PerfisService) {}

  /**
   * Cria um perfil vinculado ao usuário autenticado pelo JWT.
   * @param body Nome e descrição recebidos na requisição.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com o resultado ou o erro encontrado.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'CriaPerfil')
  @Post('/create')
  async create(
    @Body() body: CreatePerfilDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuarioId = request.jwtPayload.usuarioid;
      const perfil = await this.perfisService.create(
        body,
        usuarioId,
        request.jwtPayload.organizacaoid,
      );

      return response
        .status(HttpStatus.CREATED)
        .json(
          createApiResponse(
            'Perfil criado com sucesso.',
            HttpStatus.CREATED,
            perfil,
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
            'Erro ao criar perfil.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Consulta um único perfil pelo identificador informado.
   * @param id Identificador do perfil recebido na URL.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com o perfil encontrado ou o erro.
   */
  @Get('/findOne/:id')
  async findOne(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const perfil = await this.perfisService.findOne(Number(id));

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Perfil consultado com sucesso.',
            HttpStatus.OK,
            perfil,
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
            'Erro ao consultar perfil.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Lista todos os perfis cadastrados para consulta.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a lista de perfis ou o erro.
   */
  @Get('/findAll')
  async findAll(@Res() response: Response): Promise<Response> {
    try {
      const perfis = await this.perfisService.findAll();

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Perfis consultados com sucesso.',
            HttpStatus.OK,
            perfis,
          ),
        );
    } catch {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao consultar perfis.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Atualiza um perfil e registra o usuário autenticado como responsável.
   * @param id Identificador do perfil recebido na URL.
   * @param body Nome e descrição atualizados recebidos na requisição.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a confirmação da atualização ou o erro.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'AtualizaPerfil')
  @Put('/update/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePerfilDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.perfisService.update(
        Number(id),
        body,
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse('Perfil atualizado com sucesso.', HttpStatus.OK),
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
            'Erro ao atualizar perfil.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Exclui um perfil e seus vínculos com permissões quando não houver usuários vinculados.
   * @param id Identificador do perfil recebido na URL.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com a confirmação da exclusão ou o erro.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'DeletaPerfil')
  @Delete('/remove/:id')
  async remove(
    @Param('id') id: string,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.perfisService.remove(
        Number(id),
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );

      return response
        .status(HttpStatus.OK)
        .json(createApiResponse('Perfil excluído com sucesso.', HttpStatus.OK));
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
            'Erro ao excluir perfil.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Associa permissões ao perfil informado usando o usuário autenticado na auditoria.
   * @param perfilId Identificador do perfil recebido na URL.
   * @param body Identificadores das permissões recebidos na requisição.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com o resultado ou o erro encontrado.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'AtualizaPerfil')
  @Post('/associate-permissions/:perfilId')
  async associatePermissions(
    @Param('perfilId') perfilId: string,
    @Body() body: AssociatePermissoesDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.perfisService.associatePermissions(
        Number(perfilId),
        body,
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );

      return response
        .status(HttpStatus.CREATED)
        .json(
          createApiResponse(
            'Permissões associadas ao perfil com sucesso.',
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
            'Erro ao associar permissões ao perfil.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }

  /**
   * Remove um único vínculo entre o perfil e a permissão informada.
   * @param perfilId Identificador do perfil recebido na URL.
   * @param permissaoId Identificador da permissão recebido na URL.
   * @param request Requisição autenticada que contém o payload do JWT.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com o resultado ou o erro encontrado.
   */
  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'AtualizaPerfil')
  @Delete('/remove-permission/:perfilId/permissoes/:permissaoId')
  async removePermissions(
    @Param('perfilId') perfilId: string,
    @Param('permissaoId') permissaoId: string,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.perfisService.removePermissions(
        Number(perfilId),
        Number(permissaoId),
        request.jwtPayload.usuarioid,
        request.jwtPayload.organizacaoid,
      );

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Vínculo entre perfil e permissão removido com sucesso.',
            HttpStatus.OK,
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
            'Erro ao remover permissões do perfil.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
