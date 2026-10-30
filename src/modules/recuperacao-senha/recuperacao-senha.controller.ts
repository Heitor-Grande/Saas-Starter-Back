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
import type {
  RedefinirSenhaDto,
  SolicitarRecuperacaoSenhaDto,
  ValidarCodigoRecuperacaoDto,
} from './dto/recuperacao-senha.dto';
import { RecuperacaoSenhaService } from './recuperacao-senha.service';

@Controller('recuperacao-senha')
export class RecuperacaoSenhaController {
  constructor(private readonly service: RecuperacaoSenhaService) {}

  @Post('solicitar')
  async solicitar(
    @Body() body: SolicitarRecuperacaoSenhaDto,
    @Res() response: Response,
  ): Promise<Response> {
    return this.executar(response, async () => ({
      message: 'Se o e-mail estiver cadastrado, o código foi enviado.',
      data: await this.service.solicitar(body),
    }));
  }

  @Post('validar-codigo')
  async validarCodigo(
    @Body() body: ValidarCodigoRecuperacaoDto,
    @Res() response: Response,
  ): Promise<Response> {
    return this.executar(response, async () => ({
      message: 'Código validado com sucesso.',
      data: await this.service.validarCodigo(body),
    }));
  }

  @Post('redefinir')
  async redefinir(
    @Body() body: RedefinirSenhaDto,
    @Res() response: Response,
  ): Promise<Response> {
    return this.executar(response, async () => {
      await this.service.redefinir(body);
      return { message: 'Senha redefinida com sucesso.' };
    });
  }

  private async executar(
    response: Response,
    action: () => Promise<{ message: string; data?: unknown }>,
  ): Promise<Response> {
    try {
      const result = await action();
      return response
        .status(HttpStatus.OK)
        .json(createApiResponse(result.message, HttpStatus.OK, result.data));
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
            'Não foi possível concluir a recuperação de senha.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
