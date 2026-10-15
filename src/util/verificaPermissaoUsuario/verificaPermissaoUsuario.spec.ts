import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { verificaPermissaoUsuario } from './verificaPermissaoUsuario';

describe('Verificação de permissão do usuário', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve retornar true quando o perfil possui a permissão', async () => {
    const query = jest.spyOn(postgresPool, 'query');
    query
      .mockResolvedValueOnce({ rows: [{ perfilid: 4 }] } as never)
      .mockResolvedValueOnce({ rows: [{ id: 10 }] } as never);

    await expect(verificaPermissaoUsuario(2, 'VisualizaPerfis')).resolves.toBe(
      true,
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM perfil_permissao pp'),
      [4, 'VisualizaPerfis'],
    );
  });

  it('deve retornar false quando o perfil não possui a permissão', async () => {
    const query = jest.spyOn(postgresPool, 'query');
    query
      .mockResolvedValueOnce({ rows: [{ perfilid: 4 }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await expect(verificaPermissaoUsuario(2, 'VisualizaPerfis')).resolves.toBe(
      false,
    );
  });

  it('deve retornar false quando o usuário não existe', async () => {
    const query = jest
      .spyOn(postgresPool, 'query')
      .mockResolvedValueOnce({ rows: [] } as never);

    await expect(verificaPermissaoUsuario(2, 'VisualizaPerfis')).resolves.toBe(
      false,
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve retornar false para parâmetros inválidos sem consultar o banco', async () => {
    const query = jest.spyOn(postgresPool, 'query');

    await expect(verificaPermissaoUsuario(0, '')).resolves.toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});
