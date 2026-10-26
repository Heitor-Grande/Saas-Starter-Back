import { BadRequestException, HttpStatus } from '@nestjs/common';
import { mockResponse } from '../../test/helpers/http-mock';
import { CadastroInicialController } from './cadastro-inicial.controller';
import type { CadastroInicialService } from './cadastro-inicial.service';
import type { CreateCadastroInicialDto } from './dto/create-cadastro-inicial.dto';

describe('Controller de cadastro inicial', () => {
  const dto = {} as CreateCadastroInicialDto;

  it('deve retornar sucesso ao cadastrar organizacao e usuario', async () => {
    const cadastro = {
      organizacao: { id: 1 },
      usuario: { id: 2 },
    };
    const create = jest.fn().mockResolvedValue(cadastro);
    const service = {
      create,
    } as unknown as CadastroInicialService;
    const responseMock = mockResponse();
    const response = responseMock.response;
    const controller = new CadastroInicialController(service);

    await controller.create(dto, response);

    expect(create).toHaveBeenCalledWith(dto);
    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(responseMock.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CREATED,
      message: 'Cadastro inicial realizado com sucesso.',
      data: cadastro,
    });
  });

  it('deve retornar erro de validacao quando o service rejeitar os dados', async () => {
    const create = jest
      .fn()
      .mockRejectedValue(new BadRequestException('Dados invalidos.'));
    const service = {
      create,
    } as unknown as CadastroInicialService;
    const responseMock = mockResponse();
    const response = responseMock.response;
    const controller = new CadastroInicialController(service);

    await controller.create(dto, response);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(responseMock.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Dados invalidos.',
      data: null,
    });
  });
});

/**
 * Cria um mock encadeavel de resposta HTTP para testar o controller.
 * @returns Um objeto com os metodos status e json monitorados pelo Jest.
 */
