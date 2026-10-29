import { BadRequestException } from '@nestjs/common';
import { mockTransacaoSequencial } from '../../test/helpers/postgres-mock';
import * as bcryptUtil from '../../util/bcrypt/bcrypt';
import { CadastroInicialService } from './cadastro-inicial.service';
import type {
  CadastroInicialOrganizacaoDto,
  CadastroInicialUsuarioDto,
  CreateCadastroInicialDto,
} from './dto/create-cadastro-inicial.dto';

describe('Servico de cadastro inicial', () => {
  const dto: CreateCadastroInicialDto = {
    organizacao: {
      nome: 'Acme SaaS',
      cnpj: '12.345.678/0001-90',
      planoid: 1,
      cep: '01001-000',
      logradouro: 'Rua Central',
      numero: '123',
      complemento: 'Sala 4',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'sp',
    },
    usuario: {
      nome: 'Maria Silva',
      nomesocial: 'Maria',
      cpf: '123.456.789-00',
      datanascimento: '1990-01-01',
      email: 'MARIA@EXAMPLE.COM',
      telefone: '(11) 99999-9999',
      perfilid: 10,
      cargo: 'Administradora',
      ativo: true,
      senha: 'Senha-segura1!',
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve criar organizacao, usuario e atualizar a organizacao em transacao', async () => {
    const organizacaoCriada = {
      id: 10,
      nome: 'Acme SaaS',
      cnpj: '12345678000190',
      planoid: 1,
      usuarioresponsavelid: null,
      cep: '01001000',
      logradouro: 'Rua Central',
      numero: '123',
      complemento: 'Sala 4',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      datacriacao: new Date(),
      criadoporusuarioid: null,
      atualizadoem: new Date(),
      atualizadoporusuarioid: null,
    } as unknown as CadastroInicialOrganizacaoDto;
    const usuarioCriado: CadastroInicialUsuarioDto = {
      id: 20,
      nome: 'Maria Silva',
      nomesocial: 'Maria',
      cpf: '12345678900',
      datanascimento: '1990-01-01',
      email: 'maria@example.com',
      telefone: '11999999999',
      organizacaoid: 10,
      perfilid: 10,
      cargo: 'Administradora',
      ativo: true,
      datacriacao: new Date(),
    };
    const organizacaoAtualizada: CadastroInicialOrganizacaoDto = {
      ...organizacaoCriada,
      usuarioresponsavelid: 20,
      criadoporusuarioid: 20,
      atualizadoporusuarioid: 20,
    };
    const { query, release } = mockTransacaoSequencial([
      {},
      { rows: [organizacaoCriada] },
      { rows: [usuarioCriado] },
      { rows: [organizacaoAtualizada] },
      {},
      {},
    ]);
    jest.spyOn(bcryptUtil, 'generateHash').mockReturnValue({
      hash: 'hash-da-senha',
      saltRounds: 10,
    });
    const service = new CadastroInicialService();

    const result = await service.create(dto);

    expect(result).toEqual({
      organizacao: organizacaoAtualizada,
      usuario: usuarioCriado,
    });
    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.arrayContaining(['Acme SaaS', '12345678000190', 1]),
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.arrayContaining([
        'Maria Silva',
        'Maria',
        '12345678900',
        '1990-01-01',
        'maria@example.com',
        '11999999999',
        10,
        10,
        'Administradora',
        true,
        'hash-da-senha',
        10,
      ]),
    );
    expect(query).toHaveBeenNthCalledWith(4, expect.any(String), [20, 10]);
    expect(query).toHaveBeenNthCalledWith(
      5,
      expect.any(String),
      expect.any(Array),
    );
    expect(query).toHaveBeenNthCalledWith(6, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar dados obrigatorios invalidos', async () => {
    const service = new CadastroInicialService();

    await expect(
      service.create({
        ...dto,
        organizacao: { ...dto.organizacao, cnpj: '123' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve desfazer a transacao quando houver erro de unicidade', async () => {
    const erroUnicidade = Object.assign(new Error('registro duplicado'), {
      code: '23505',
    });
    const { query, release } = mockTransacaoSequencial([
      {},
      { rows: [{ id: 10 }] },
      erroUnicidade,
      {},
    ]);
    jest.spyOn(bcryptUtil, 'generateHash').mockReturnValue({
      hash: 'hash-da-senha',
      saltRounds: 10,
    });
    const service = new CadastroInicialService();

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query).toHaveBeenNthCalledWith(4, 'ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
