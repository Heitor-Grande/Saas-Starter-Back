import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { PlanoDto } from './dto/create-plano.dto';
import { PlanosService } from './planos.service';

const plano: PlanoDto = {
  id: 1,
  nome: 'Starter',
  valor: '49.90',
  descricao: 'Plano inicial',
  criadoporusuarioid: 2,
  datacriacao: new Date(),
  atualizadoem: new Date(),
  atualizadoporusuarioid: 2,
};

describe('Serviço de planos', () => {
  afterEach(() => jest.restoreAllMocks());

  it('deve criar um plano e registrar o log', async () => {
    const query = jest.fn((sql: string) =>
      Promise.resolve(
        sql.includes('INSERT INTO planos') ? { rows: [plano] } : { rows: [] },
      ),
    );
    const release = jest.fn();
    jest
      .spyOn(postgresPool, 'connect')
      .mockResolvedValue({ query, release } as unknown as PoolClient);

    await expect(
      new PlanosService().create(
        { nome: 'Starter', valor: 49.9, descricao: 'Plano inicial' },
        2,
        3,
      ),
    ).resolves.toEqual(plano);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      expect.arrayContaining([3, 2, expect.any(Date), 'POST']),
    );
    expect(query).toHaveBeenCalledWith('COMMIT');
  });

  it('deve listar todos os planos', async () => {
    jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      rows: [plano],
      fields: [],
    });
    await expect(new PlanosService().findAll()).resolves.toEqual([plano]);
  });

  it('deve informar quando o plano não for encontrado', async () => {
    jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      rows: [],
      fields: [],
    });
    await expect(new PlanosService().findOne(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve rejeitar dados inválidos', async () => {
    await expect(
      new PlanosService().create({ nome: '', valor: -1, descricao: '' }, 2, 3),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
