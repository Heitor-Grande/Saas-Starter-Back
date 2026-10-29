import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
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
import type { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

@SetMetadata(PERMISSAO_NECESSARIA_KEY, 'VisualizarUsuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'CriarUsuarios')
  @Post()
  async create(
    @Body() body: CreateUsuarioDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuario = await this.service.create(
        request.jwtPayload.organizacaoid,
        request.jwtPayload.usuarioid,
        body,
      );
      return response
        .status(HttpStatus.CREATED)
        .json(
          createApiResponse(
            'Usuário criado com sucesso.',
            HttpStatus.CREATED,
            usuario,
          ),
        );
    } catch (error) {
      return this.handleError(error, response, 'criar');
    }
  }

  @Get()
  async findAll(
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuarios = await this.service.findAll(
        request.jwtPayload.organizacaoid,
      );
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Usuários consultados com sucesso.',
            HttpStatus.OK,
            usuarios,
          ),
        );
    } catch (error) {
      return this.handleError(error, response, 'consultar');
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuario = await this.service.findOne(
        Number(id),
        request.jwtPayload.organizacaoid,
      );
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
      return this.handleError(error, response, 'consultar');
    }
  }

  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'AtualizarUsuarios')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUsuarioDto,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const usuario = await this.service.update(
        Number(id),
        request.jwtPayload.organizacaoid,
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
      return this.handleError(error, response, 'atualizar');
    }
  }

  @SetMetadata(PERMISSAO_NECESSARIA_KEY, 'DeletarUsuarios')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() request: JwtAuthenticatedRequest,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      await this.service.remove(
        Number(id),
        request.jwtPayload.organizacaoid,
        request.jwtPayload.usuarioid,
      );
      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse('Usuário excluído com sucesso.', HttpStatus.OK),
        );
    } catch (error) {
      return this.handleError(error, response, 'excluir');
    }
  }

  private handleError(
    error: unknown,
    response: Response,
    operacao: 'criar' | 'consultar' | 'atualizar' | 'excluir',
  ): Response {
    if (error instanceof BadRequestException)
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json(createApiResponse(error.message, HttpStatus.BAD_REQUEST, null));
    if (error instanceof NotFoundException)
      return response
        .status(HttpStatus.NOT_FOUND)
        .json(createApiResponse(error.message, HttpStatus.NOT_FOUND, null));
    if (error instanceof ForbiddenException)
      return response
        .status(HttpStatus.FORBIDDEN)
        .json(createApiResponse(error.message, HttpStatus.FORBIDDEN, null));
    if (error instanceof ConflictException)
      return response
        .status(HttpStatus.CONFLICT)
        .json(createApiResponse(error.message, HttpStatus.CONFLICT, null));
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        createApiResponse(
          `Erro ao ${operacao} usuário.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
          null,
        ),
      );
  }
}
