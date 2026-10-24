import type { PoolClient } from 'pg';
import { executarEmTransacao } from './executar-em-transacao';

/** Cria um executor falso para isolar os testes da conexão PostgreSQL real. */
function criarExecutor(): {
  client: PoolClient;
  connect: jest.Mock;
  query: jest.Mock;
  release: jest.Mock;
} {
  const query = jest.fn().mockResolvedValue({});
  const release = jest.fn();
  const client = { query, release } as unknown as PoolClient;
  const connect = jest.fn().mockResolvedValue(client);

  return { client, connect, query, release };
}

describe('executarEmTransacao', () => {
  it('deve confirmar a transação e retornar o resultado da operação', async () => {
    const { client, connect, query, release } = criarExecutor();
    const operacao = jest.fn().mockResolvedValue({ id: 10 });

    await expect(executarEmTransacao(operacao, { connect })).resolves.toEqual({
      id: 10,
    });

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(operacao).toHaveBeenCalledWith(client);
    expect(query).toHaveBeenNthCalledWith(2, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve desfazer a transação quando a operação falhar', async () => {
    const { connect, query, release } = criarExecutor();
    const operacao = jest.fn().mockRejectedValue(new Error('falha'));

    await expect(executarEmTransacao(operacao, { connect })).rejects.toThrow(
      'falha',
    );

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
