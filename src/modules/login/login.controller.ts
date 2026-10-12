import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { createApiResponse } from '../../util/api-response/api-response';
import type { LoginRequestDto } from './dto/login.dto';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  /**
   * Recebe o servico responsavel por validar credenciais e gerar JWT.
   * @param loginService Servico de login fornecido pelo NestJS.
   * @returns Uma instancia do controller de login.
   */
  constructor(private readonly loginService: LoginService) {}

  /**
   * Autentica um usuario por e-mail e senha para devolver o token JWT.
   * @param body Credenciais enviadas pelo usuario.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com o token JWT ou o erro encontrado.
   */
  @Post()
  async login(
    @Body() body: LoginRequestDto,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const login = await this.loginService.login(body);

      return response
        .status(HttpStatus.OK)
        .json(
          createApiResponse(
            'Login realizado com sucesso.',
            HttpStatus.OK,
            login,
          ),
        );
    } catch (error) {
      if (error instanceof BadRequestException) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json(createApiResponse(error.message, HttpStatus.BAD_REQUEST, null));
      }

      if (error instanceof UnauthorizedException) {
        return response
          .status(HttpStatus.UNAUTHORIZED)
          .json(
            createApiResponse(error.message, HttpStatus.UNAUTHORIZED, null),
          );
      }

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao realizar login.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
