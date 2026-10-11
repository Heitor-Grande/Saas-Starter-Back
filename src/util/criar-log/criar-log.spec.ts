import { BadRequestException } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { criarLog } from './criar-log';

describe('criarLog', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve registrar a alteracao com os estados anterior e posterior', async () => {
    const query = jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'INSERT',
      rowCount: 1,
      oid: 0,
      rows: [],
      fields: [],
    });
    const feitoem = new Date('2026-10-11T12:00:00.000Z');

    await criarLog({
      organizacaoid: 1,
      feitoporusuarioid: 2,
      feitoem,
      acao: 'patch',
      antes: { ativo: false },
      depois: { ativo: true },
    });

    expect(query).toHaveBeenCalledWith(expect.any(String), [
      1,
      2,
      feitoem,
      'PATCH',
      JSON.stringify({ ativo: false }),
      JSON.stringify({ ativo: true }),
    ]);
  });

  it('deve aceitar estados anterior e posterior ausentes', async () => {
    const query = jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'INSERT',
      rowCount: 1,
      oid: 0,
      rows: [],
      fields: [],
    });

    await criarLog({
      organizacaoid: 1,
      feitoporusuarioid: 2,
      feitoem: new Date('2026-10-11T12:00:00.000Z'),
      acao: 'post',
    });

    expect(query).toHaveBeenCalledWith(expect.any(String), [
      1,
      2,
      expect.any(Date),
      'POST',
      null,
      null,
    ]);
  });

  it('deve rejeitar parametros invalidos', async () => {
    await expect(
      criarLog({
        organizacaoid: 0,
        feitoporusuarioid: 2,
        feitoem: new Date(),
        acao: 'post',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
