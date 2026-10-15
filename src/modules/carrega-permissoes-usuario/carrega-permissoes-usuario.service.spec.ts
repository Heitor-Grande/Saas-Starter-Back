import { NotFoundException } from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { CarregaPermissoesUsuarioService } from './carrega-permissoes-usuario.service';

describe('Serviço de carregamento de permissões do usuário', () => {
  const service = new CarregaPermissoesUsuarioService();
  let query: jest.MockedFunction<
    (
      sql: string,
      values?: number[],
    ) => Promise<{ rows: Record<string, unknown>[] }>
  >;

  beforeEach(() => {
    query = jest.spyOn(postgresPool, 'query') as unknown as typeof query;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve incluir todas as permissões e permitir apenas as vinculadas ao perfil', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ perfilid: 8 }] })
      .mockResolvedValueOnce({ rows: [{ permissaoid: 20 }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 10, nome: 'AcessoMinhaOrganização' },
          { id: 20, nome: 'AcessoSistema' },
        ],
      });

    await expect(service.carregar(3)).resolves.toEqual([
      { permissão: 'AcessoMinhaOrganização', temacesso: false },
      { permissão: 'AcessoSistema', temacesso: true },
    ]);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'SELECT perfilid FROM usuarios WHERE id = $1',
      [3],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'SELECT permissaoid FROM perfil_permissao WHERE perfilid = $1',
      [8],
    );
  });

  it('deve negar todos os acessos quando o perfil não possui vínculos', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ perfilid: 8 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 10, nome: 'AcessoMinhaOrganização' }],
      });

    await expect(service.carregar(3)).resolves.toEqual([
      { permissão: 'AcessoMinhaOrganização', temacesso: false },
    ]);
  });

  it('deve retornar uma lista vazia quando não existem permissões cadastradas', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ perfilid: 8 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(service.carregar(3)).resolves.toEqual([]);
  });

  it('deve interromper a consulta quando o usuário não existe', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(service.carregar(3)).rejects.toBeInstanceOf(NotFoundException);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
