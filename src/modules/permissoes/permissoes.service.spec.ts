import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { PermissaoDto } from './dto/create-permissao.dto';
import { PermissoesService } from './permissoes.service';

describe('Serviço de permissões', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve criar uma permissão', async () => {
    const permissao: PermissaoDto = {
      id: 10,
      nome: 'Criar usuário',
      descricao: 'Permite criar novos usuários',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PermissaoDto[] }>
    >;
    query.mockResolvedValue({ rows: [permissao] });
    const service = new PermissoesService();

    const result = await service.create(
      {
        nome: 'Criar usuário',
        descricao: 'Permite criar novos usuários',
      },
      1,
    );

    expect(result).toEqual(permissao);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar uma permissão sem nome', async () => {
    const service = new PermissoesService();

    await expect(
      service.create({ nome: '', descricao: 'Descrição' }, 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve consultar uma permissão pelo identificador', async () => {
    const permissao: PermissaoDto = {
      id: 10,
      nome: 'Criar usuário',
      descricao: 'Permite criar novos usuários',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 1,
      atualizadoem: new Date(),
    };
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PermissaoDto[] }>
    >;
    query.mockResolvedValue({ rows: [permissao] });
    const service = new PermissoesService();

    await expect(service.findOne(10)).resolves.toEqual(permissao);
    expect(query).toHaveBeenCalledWith(expect.any(String), [10]);
  });

  it('deve informar quando a permissão não for encontrada', async () => {
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PermissaoDto[] }>
    >;
    query.mockResolvedValue({ rows: [] });
    const service = new PermissoesService();

    await expect(service.findOne(10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve listar todas as permissões cadastradas', async () => {
    const permissoes: PermissaoDto[] = [
      {
        id: 10,
        nome: 'Criar usuário',
        descricao: 'Permite criar novos usuários',
        criadoporusuarioid: 1,
        datacriacao: new Date(),
        atualizadoporusuarioid: 1,
        atualizadoem: new Date(),
      },
    ];
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string) => Promise<{ rows: PermissaoDto[] }>
    >;
    query.mockResolvedValue({ rows: permissoes });
    const service = new PermissoesService();

    await expect(service.findAll()).resolves.toEqual(permissoes);
  });

  it('deve atualizar uma permissão', async () => {
    const permissao: PermissaoDto = {
      id: 10,
      nome: 'Editar usuário',
      descricao: 'Permite editar usuários',
      criadoporusuarioid: 1,
      datacriacao: new Date(),
      atualizadoporusuarioid: 2,
      atualizadoem: new Date(),
    };
    const query = jest.spyOn(
      postgresPool,
      'query',
    ) as unknown as jest.MockedFunction<
      (query: string, values: unknown[]) => Promise<{ rows: PermissaoDto[] }>
    >;
    query.mockResolvedValue({ rows: [permissao] });
    const service = new PermissoesService();

    const result = await service.update(
      10,
      { nome: 'Editar usuário', descricao: 'Permite editar usuários' },
      2,
    );

    expect(result).toEqual(permissao);
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'Editar usuário',
      'Permite editar usuários',
      2,
      10,
    ]);
  });

  it('deve excluir os vínculos antes de excluir a permissão', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});
    const release = jest.fn();
    const connect = jest.spyOn(
      postgresPool,
      'connect',
    ) as unknown as jest.MockedFunction<() => Promise<PoolClient>>;
    connect.mockResolvedValue({ query, release } as unknown as PoolClient);
    const service = new PermissoesService();

    await service.remove(10);

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM perfil_permissao WHERE permissaoid = $1',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM permissoes WHERE id = $1 RETURNING id',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve desfazer a exclusão quando a permissão não existir', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({});
    const release = jest.fn();
    const connect = jest.spyOn(
      postgresPool,
      'connect',
    ) as unknown as jest.MockedFunction<() => Promise<PoolClient>>;
    connect.mockResolvedValue({ query, release } as unknown as PoolClient);
    const service = new PermissoesService();

    await expect(service.remove(10)).rejects.toBeInstanceOf(NotFoundException);
    expect(query).toHaveBeenNthCalledWith(4, 'ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
