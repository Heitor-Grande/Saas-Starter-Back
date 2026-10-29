import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  mockClienteTransacional,
  mockConsultas,
} from '../../test/helpers/postgres-mock';
import { MeuUsuarioService } from './meu-usuario.service';

describe('Serviço de consulta do usuário autenticado', () => {
  const service = new MeuUsuarioService();

  afterEach(() => jest.restoreAllMocks());

  it('deve consultar e retornar o usuário pelo ID', async () => {
    const usuario = {
      id: 3,
      nome: 'Maria Silva',
      nomesocial: 'Maria',
      cpf: '12345678900',
      datanascimento: '1990-01-01',
      email: 'maria@example.com',
      telefone: '11999999999',
      ativo: true,
      organizacao: 'Organização Exemplo',
      perfil: 'Administrador',
      cargo: 'Gestora',
    };
    const query = mockConsultas([[usuario]]);

    await expect(service.findById(3)).resolves.toEqual(usuario);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE usuarios.id = $1'),
      [3],
    );
  });

  it('deve retornar 404 quando o usuário não existe', async () => {
    mockConsultas([[]]);

    await expect(service.findById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve atualizar somente os campos permitidos e registrar o log', async () => {
    const anterior = {
      id: 3,
      nome: 'Maria Silva',
      nomesocial: 'Maria',
      cpf: '12345678900',
      datanascimento: '1990-01-01',
      email: 'maria@example.com',
      telefone: '11999999999',
      ativo: true,
      cargo: 'Gestora',
      organizacaoid: 2,
    };
    const atualizado = {
      ...anterior,
      nome: 'Maria Souza',
      organizacao: 'Organização Exemplo',
      perfil: 'Administrador',
    };
    const { query } = mockClienteTransacional((sql) => {
      if (sql.includes('FROM usuarios') && sql.includes('FOR UPDATE')) {
        return { rows: [anterior] };
      }
      if (sql.includes('UPDATE usuarios')) return { rows: [atualizado] };
      return {};
    });

    await expect(
      service.update(3, {
        nome: ' Maria Souza ',
        nomesocial: 'Maria',
        cpf: '123.456.789-00',
        datanascimento: '1990-01-01',
        email: 'MARIA@example.com',
        telefone: '(11) 99999-9999',
        cargo: 'Gestora',
        ativo: true,
      }),
    ).resolves.toEqual(atualizado);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SET nome = $1'),
      [
        'Maria Souza',
        'Maria',
        '12345678900',
        '1990-01-01',
        'maria@example.com',
        '11999999999',
        'Gestora',
        true,
        3,
      ],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      expect.arrayContaining([2, 3, expect.any(Date), 'PUT']),
    );
  });

  it('deve rejeitar dados inválidos antes de abrir uma transação', async () => {
    await expect(
      service.update(3, {
        nome: '',
        cpf: '123',
        datanascimento: 'inválida',
        email: 'inválido',
        telefone: '1',
        ativo: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve retornar conflito quando CPF ou e-mail já estiver em uso', async () => {
    const error = Object.assign(new Error('unique violation'), {
      code: '23505',
    });
    mockClienteTransacional((sql) => {
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ id: 3, organizacaoid: 2 }] };
      }
      if (sql.includes('UPDATE usuarios')) throw error;
      return {};
    });

    await expect(
      service.update(3, {
        nome: 'Maria',
        cpf: '12345678900',
        datanascimento: '1990-01-01',
        email: 'maria@example.com',
        telefone: '11999999999',
        ativo: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
