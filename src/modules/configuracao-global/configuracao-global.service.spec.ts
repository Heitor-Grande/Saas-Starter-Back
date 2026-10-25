import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import type { ConfiguracaoGlobalDto } from './dto/configuracao-global.dto';
import { ConfiguracaoGlobalService } from './configuracao-global.service';

const configuracao: ConfiguracaoGlobalDto = {
  id: 1,
  nome_aplicacao: 'SaaS Starter',
  email_suporte: 'suporte@example.com',
  smtp_servidor: null,
  smtp_porta: null,
  smtp_usuario: null,
  smtp_remetente_nome: null,
  smtp_remetente_email: null,
  criado_em: new Date(),
  atualizado_em: new Date(),
  atualizadoporusuarioid: null,
};

describe('Serviço de configuração global', () => {
  afterEach(() => jest.restoreAllMocks());

  it('deve carregar sempre a configuração de id 1', async () => {
    const query = jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      rows: [configuracao],
      fields: [],
    });
    await expect(new ConfiguracaoGlobalService().findOne()).resolves.toEqual(
      configuracao,
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = 1'));
  });

  it('deve informar quando a configuração não existir', async () => {
    jest.spyOn(postgresPool, 'query').mockResolvedValue({
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      rows: [],
      fields: [],
    });
    await expect(
      new ConfiguracaoGlobalService().findOne(),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve atualizar e auditar sem registrar a senha SMTP', async () => {
    const atualizada = {
      ...configuracao,
      nome_aplicacao: 'Nova aplicação',
      atualizadoporusuarioid: 2,
    };
    const query = jest.fn((sql: string) =>
      Promise.resolve(
        sql.includes('UPDATE configuracao_global')
          ? { rows: [atualizada] }
          : sql.includes('FROM configuracao_global')
            ? { rows: [configuracao] }
            : { rows: [] },
      ),
    );
    jest.spyOn(postgresPool, 'connect').mockResolvedValue({
      query,
      release: jest.fn(),
    } as unknown as PoolClient);
    await expect(
      new ConfiguracaoGlobalService().update(
        {
          ...configuracao,
          nome_aplicacao: 'Nova aplicação',
          smtp_senha: 'segredo',
        },
        2,
        3,
      ),
    ).resolves.toEqual(atualizada);
    const chamadaLog = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO log'),
    );
    expect(chamadaLog?.[1]).not.toContain('segredo');
  });

  it('deve rejeitar uma porta SMTP inválida', async () => {
    await expect(
      new ConfiguracaoGlobalService().update(
        { nome_aplicacao: 'App', smtp_porta: 70000 },
        2,
        3,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
