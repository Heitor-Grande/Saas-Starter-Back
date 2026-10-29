import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  mockClienteTransacional,
  mockConsultas,
} from '../../test/helpers/postgres-mock';
import { UsuariosService } from './usuarios.service';

const usuario = {
  id: 5,
  nome: 'Maria Silva',
  nomesocial: 'Maria',
  cpf: '12345678900',
  datanascimento: '1990-01-01',
  email: 'maria@example.com',
  telefone: '11999999999',
  perfilid: 2,
  perfil: 'Gestor',
  cargo: 'Gerente',
  ativo: true,
  datacriacao: new Date('2026-01-01T00:00:00.000Z'),
};
const dto = {
  nome: 'Maria Silva',
  nomesocial: 'Maria',
  cpf: '123.456.789-00',
  datanascimento: '1990-01-01',
  email: 'MARIA@example.com',
  telefone: '(11) 99999-9999',
  perfilid: 2,
  cargo: 'Gerente',
  ativo: true,
  senha: 'Senha@1',
};

describe('Serviço de usuários', () => {
  const service = new UsuariosService();
  const originalSaltRounds = process.env.BCRYPT_SALT_ROUNDS;

  beforeAll(() => {
    process.env.BCRYPT_SALT_ROUNDS = '4';
  });
  afterAll(() => {
    process.env.BCRYPT_SALT_ROUNDS = originalSaltRounds;
  });
  afterEach(() => jest.restoreAllMocks());

  it('deve listar apenas os usuários da organização informada', async () => {
    const query = mockConsultas([[usuario]]);
    await expect(service.findAll(2)).resolves.toEqual([usuario]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE usuarios.organizacaoid = $1'),
      [2],
    );
  });

  it('deve abrir somente usuário pertencente à organização', async () => {
    const query = mockConsultas([[usuario], [{ id: 2, nome: 'Gestor' }]]);
    await expect(service.findOne(5, 2)).resolves.toEqual({
      ...usuario,
      perfis: [{ id: 2, nome: 'Gestor' }],
    });
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        'WHERE usuarios.id = $1 AND usuarios.organizacaoid = $2',
      ),
      [5, 2],
    );
  });

  it('deve retornar 404 ao tentar abrir usuário de outra organização', async () => {
    mockConsultas([[]]);
    await expect(service.findOne(5, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve criar usuário na organização do JWT e auditar sem expor senha', async () => {
    const { query } = mockClienteTransacional((sql) => {
      if (sql.startsWith('SELECT id FROM perfis')) return { rows: [{ id: 2 }] };
      if (sql.includes('INSERT INTO usuarios')) return { rows: [usuario] };
      return {};
    });

    await expect(service.create(2, 3, dto)).resolves.toEqual(usuario);
    const insert = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO usuarios'),
    );
    expect(insert?.[1]).toEqual(
      expect.arrayContaining(['12345678900', 'maria@example.com', 2]),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      expect.arrayContaining([2, 3, expect.any(Date), 'POST']),
    );
  });

  it('deve atualizar o cadastro sem alterar a senha', async () => {
    const { query } = mockClienteTransacional((sql) => {
      if (sql.includes('FOR UPDATE OF usuarios')) return { rows: [usuario] };
      if (sql.startsWith('SELECT id FROM perfis')) return { rows: [{ id: 2 }] };
      if (sql.includes('UPDATE usuarios SET')) return { rows: [usuario] };
      return {};
    });
    const { senha: _senha, ...semSenha } = dto;

    await expect(service.update(5, 2, 3, semSenha)).resolves.toEqual(usuario);
    const update = query.mock.calls.find(([sql]) =>
      String(sql).includes('UPDATE usuarios SET'),
    );
    expect(update?.[0]).not.toContain('senhahash');
    expect(update?.[0]).not.toContain('saltroundsenha');
    expect(update?.[1]?.slice(-2)).toEqual([5, 2]);
  });

  it('deve impedir a exclusão do próprio usuário', async () => {
    await expect(service.remove(3, 2, 3)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deve rejeitar cadastro inválido', async () => {
    await expect(
      service.create(2, 3, { ...dto, cpf: '123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
