import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { PerfilDetalhadoDto, PerfilDto } from './dto/create-perfil.dto';
import { PerfisService } from './perfis.service';

type QueryResultMock = {
  rows?: unknown[];
  rowCount?: number;
};

/** Cria um cliente transacional falso que responde conforme o SQL recebido. */
function mockClient(
  resolver: (sql: string, valores?: unknown[]) => QueryResultMock,
): { query: jest.Mock; release: jest.Mock } {
  const query = jest.fn((sql: string, valores?: unknown[]) =>
    Promise.resolve({
      rows: [],
      rowCount: 0,
      ...resolver(sql, valores),
    }),
  );
  const release = jest.fn();
  jest
    .spyOn(postgresPool, 'connect')
    .mockResolvedValue({ query, release } as unknown as PoolClient);

  return { query, release };
}

describe('Serviço de perfis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve criar um perfil e registrar o log na mesma transação', async () => {
    const perfil: PerfilDto = {
      id: 10,
      nome: 'Administrador',
      descricao: 'Acesso administrativo',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const { query } = mockClient((sql) =>
      sql.includes('INSERT INTO perfis') ? { rows: [perfil], rowCount: 1 } : {},
    );
    const service = new PerfisService();

    await expect(
      service.create(
        { nome: 'Administrador', descricao: 'Acesso administrativo' },
        1,
        2,
      ),
    ).resolves.toEqual(perfil);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      expect.arrayContaining([2, 1, expect.any(Date), 'POST']),
    );
    expect(query).toHaveBeenCalledWith('COMMIT');
  });

  it('deve rejeitar um perfil sem nome', async () => {
    const service = new PerfisService();

    await expect(
      service.create({ nome: '', descricao: 'Descrição' }, 1, 2),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve consultar um perfil pelo identificador', async () => {
    const perfil: PerfilDto = {
      id: 10,
      nome: 'Administrador',
      descricao: 'Acesso administrativo',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const esperado: PerfilDetalhadoDto = { ...perfil, permissoesids: [2, 4] };
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (sql: string, valores: unknown[]) => Promise<{ rows: unknown[] }>
    >;
    query.mockResolvedValueOnce({ rows: [perfil] }).mockResolvedValueOnce({
      rows: [{ permissaoid: 2 }, { permissaoid: 4 }],
    });

    await expect(new PerfisService().findOne(10)).resolves.toEqual(esperado);
  });

  it('deve informar quando o perfil não for encontrado', async () => {
    jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      rows: [],
      fields: [],
    });

    await expect(new PerfisService().findOne(10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve listar todos os perfis cadastrados', async () => {
    const query = jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      rows: [],
      fields: [],
    });

    await expect(new PerfisService().findAll()).resolves.toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve atualizar um perfil registrando os estados anterior e posterior', async () => {
    const anterior = { id: 10, nome: 'Gestor antigo' } as PerfilDto;
    const posterior = { id: 10, nome: 'Gestor' } as PerfilDto;
    const { query } = mockClient((sql) => {
      if (sql.startsWith('SELECT * FROM perfis')) return { rows: [anterior] };
      if (sql.includes('UPDATE perfis')) return { rows: [posterior] };
      return {};
    });

    await expect(
      new PerfisService().update(
        10,
        { nome: 'Gestor', descricao: 'Acesso de gestão' },
        2,
        3,
      ),
    ).resolves.toEqual(posterior);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      [
        3,
        2,
        expect.any(Date),
        'PUT',
        JSON.stringify(anterior),
        JSON.stringify(posterior),
      ],
    );
  });

  it('deve excluir um perfil e registrar o estado anterior', async () => {
    const perfil = { id: 10, nome: 'Gestor' } as PerfilDto;
    const { query, release } = mockClient((sql) => {
      if (sql.startsWith('SELECT * FROM perfis')) return { rows: [perfil] };
      if (sql.startsWith('SELECT id FROM usuarios')) return { rowCount: 0 };
      return {};
    });

    await new PerfisService().remove(10, 2, 3);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      [3, 2, expect.any(Date), 'DELETE', JSON.stringify(perfil), null],
    );
    expect(query).toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve impedir a exclusão de um perfil vinculado a usuários', async () => {
    const { query, release } = mockClient((sql) => {
      if (sql.startsWith('SELECT * FROM perfis')) {
        return { rows: [{ id: 10 }] };
      }
      if (sql.startsWith('SELECT id FROM usuarios')) return { rowCount: 1 };
      return {};
    });

    await expect(new PerfisService().remove(10, 2, 3)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve associar permissões e registrar apenas os novos vínculos', async () => {
    const { query } = mockClient((sql) =>
      sql.includes('INSERT INTO perfil_permissao')
        ? { rows: [{ permissaoid: 1 }, { permissaoid: 2 }] }
        : {},
    );

    await new PerfisService().associatePermissions(
      10,
      { permissoesIds: [1, 2, 2] },
      5,
      3,
    );

    expect(query).toHaveBeenCalledWith(expect.any(String), [10, 5, [1, 2]]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      expect.arrayContaining([3, 5, expect.any(Date), 'POST']),
    );
  });

  it('deve rejeitar uma associação sem permissões', async () => {
    await expect(
      new PerfisService().associatePermissions(10, { permissoesIds: [] }, 5, 3),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve remover um vínculo e registrar o log', async () => {
    const vinculo = { perfilid: 10, permissaoid: 2 };
    const { query } = mockClient((sql) =>
      sql.includes('DELETE FROM perfil_permissao')
        ? { rows: [vinculo], rowCount: 1 }
        : {},
    );

    await new PerfisService().removePermissions(10, 2, 5, 3);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      [3, 5, expect.any(Date), 'DELETE', JSON.stringify(vinculo), null],
    );
  });

  it('deve rejeitar uma remoção com permissão inválida', async () => {
    await expect(
      new PerfisService().removePermissions(10, 0, 5, 3),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve desfazer a alteração quando a gravação do log falhar', async () => {
    const perfil = { id: 10, nome: 'Gestor' } as PerfilDto;
    const { query } = mockClient((sql) => {
      if (sql.includes('INSERT INTO perfis')) return { rows: [perfil] };
      if (sql.includes('INSERT INTO log')) throw new Error('falha no log');
      return {};
    });

    await expect(
      new PerfisService().create(
        { nome: 'Gestor', descricao: 'Acesso de gestão' },
        2,
        3,
      ),
    ).rejects.toThrow('falha no log');
    expect(query).toHaveBeenCalledWith('ROLLBACK');
  });
});
