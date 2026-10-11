import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { createApiResponse } from '../../util/api-response/api-response';
import { CadastroInicialService } from './cadastro-inicial.service';
import type { CreateCadastroInicialDto } from './dto/create-cadastro-inicial.dto';

@Controller('cadastro-inicial')
export class CadastroInicialController {
  /**
   * Recebe o servico responsavel pelo cadastro inicial.
   * @param cadastroInicialService Servico de cadastro inicial fornecido pelo NestJS.
   * @returns Uma instancia do controller de cadastro inicial.
   */
  constructor(
    private readonly cadastroInicialService: CadastroInicialService,
  ) {}

  /**
   * Cria a organizacao e o primeiro usuario responsavel em uma unica operacao.
   * @param body Dados da organizacao e do usuario recebidos na requisicao.
   * @param response Resposta HTTP usada para retornar o resultado padronizado.
   * @returns A resposta HTTP com os dados criados ou o erro encontrado.
   */
  @Post('/create')
  async create(
    @Body() body: CreateCadastroInicialDto,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const cadastro = await this.cadastroInicialService.create(body);

      return response
        .status(HttpStatus.CREATED)
        .json(
          createApiResponse(
            'Cadastro inicial realizado com sucesso.',
            HttpStatus.CREATED,
            cadastro,
          ),
        );
    } catch (error) {
      if (error instanceof BadRequestException) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json(createApiResponse(error.message, HttpStatus.BAD_REQUEST, null));
      }

      console.log(error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createApiResponse(
            'Erro ao realizar cadastro inicial.',
            HttpStatus.INTERNAL_SERVER_ERROR,
            null,
          ),
        );
    }
  }
}
