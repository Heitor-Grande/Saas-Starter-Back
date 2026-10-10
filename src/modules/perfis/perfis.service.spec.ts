import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { PerfilDto } from './dto/create-perfil.dto';
import { PerfisService } from './perfis.service';

describe('Serviço de perfis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve criar um perfil', async () => {
    const perfil: PerfilDto = {
      id: 10,
      nome: 'Administrador',
      descricao: 'Acesso administrativo',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PerfilDto[] }>
    >;
    query.mockResolvedValue({ rows: [perfil] });
    const service = new PerfisService();

    const result = await service.create(
      {
        nome: 'Administrador',
        descricao: 'Acesso administrativo',
      },
      1,
    );

    expect(result).toEqual(perfil);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar um perfil sem nome', async () => {
    const service = new PerfisService();

    await expect(
      service.create({ nome: '', descricao: 'Descrição' }, 1),
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
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PerfilDto[] }>
    >;
    query.mockResolvedValue({ rows: [perfil] });
    const service = new PerfisService();

    await expect(service.findOne(10)).resolves.toEqual(perfil);
    expect(query).toHaveBeenCalledWith(expect.any(String), [10]);
  });

  it('deve informar quando o perfil não for encontrado', async () => {
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PerfilDto[] }>
    >;
    query.mockResolvedValue({ rows: [] });
    const service = new PerfisService();

    await expect(service.findOne(10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve listar todos os perfis cadastrados', async () => {
    const perfis: PerfilDto[] = [];
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string) => Promise<{ rows: PerfilDto[] }>
    >;
    query.mockResolvedValue({ rows: perfis });
    const service = new PerfisService();

    await expect(service.findAll()).resolves.toEqual(perfis);
  });

  it('deve atualizar um perfil', async () => {
    const perfil: PerfilDto = {
      id: 10,
      nome: 'Gestor',
      descricao: 'Acesso de gestão',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 2,
      atualizadoem: new Date(),
    };
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PerfilDto[] }>
    >;
    query.mockResolvedValue({ rows: [perfil] });
    const service = new PerfisService();

    const result = await service.update(
      10,
      { nome: 'Gestor', descricao: 'Acesso de gestão' },
      2,
    );

    expect(result).toEqual(perfil);
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'Gestor',
      'Acesso de gestão',
      2,
      10,
    ]);
  });

  it('deve excluir os vínculos antes de excluir o perfil', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});
    const release = jest.fn();
    const connect = jest.spyOn(
      postgresPool,
      'connect',
    ) as unknown as jest.MockedFunction<() => Promise<PoolClient>>;
    connect.mockResolvedValue({ query, release } as unknown as PoolClient);
    const service = new PerfisService();

    await service.remove(10);

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      'SELECT id FROM usuarios WHERE perfilid = $1 LIMIT 1',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM perfil_permissao WHERE perfilid = $1',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      'DELETE FROM perfis WHERE id = $1 RETURNING id',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve impedir a exclusão de um perfil vinculado a usuários', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});
    const release = jest.fn();
    const connect = jest.spyOn(
      postgresPool,
      'connect',
    ) as unknown as jest.MockedFunction<() => Promise<PoolClient>>;
    connect.mockResolvedValue({ query, release } as unknown as PoolClient);
    const service = new PerfisService();

    await expect(service.remove(10)).rejects.toBeInstanceOf(ConflictException);
    expect(query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve associar permissões sem repetir identificadores', async () => {
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<unknown>
    >;
    query.mockResolvedValue({});
    const service = new PerfisService();

    await service.associatePermissions(10, { permissoesIds: [1, 2, 2] }, 5);

    expect(query).toHaveBeenCalledWith(expect.any(String), [10, 5, [1, 2]]);
  });

  it('deve rejeitar uma associação sem permissões', async () => {
    const service = new PerfisService();

    await expect(
      service.associatePermissions(10, { permissoesIds: [] }, 5),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve remover um vínculo entre perfil e permissão', async () => {
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<unknown>
    >;
    query.mockResolvedValue({});
    const service = new PerfisService();

    await service.removePermissions(10, 2);

    expect(query).toHaveBeenCalledWith(expect.any(String), [10, 2]);
  });

  it('deve rejeitar uma remoção com permissão inválida', async () => {
    const service = new PerfisService();

    await expect(service.removePermissions(10, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
