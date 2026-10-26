import { NotFoundException } from '@nestjs/common';
import { mockConsultas } from '../../test/helpers/postgres-mock';
import { CarregaPermissoesUsuarioService } from './carrega-permissoes-usuario.service';

describe('Serviço de carregamento de permissões do usuário', () => {
  const service = new CarregaPermissoesUsuarioService();
  const permissaoMock = { id: 10, nome: 'AcessoMinhaOrganização' };

  afterEach(() => jest.restoreAllMocks());

  it('deve incluir todas as permissões e permitir apenas as vinculadas ao perfil', async () => {
    const permissoes = [permissaoMock, { id: 20, nome: 'AcessoSistema' }];
    const query = mockConsultas([
      [{ perfilid: 8 }],
      [{ permissaoid: 20 }],
      permissoes,
    ]);

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
    mockConsultas([[{ perfilid: 8 }], [], [permissaoMock]]);
    await expect(service.carregar(3)).resolves.toEqual([
      { permissão: 'AcessoMinhaOrganização', temacesso: false },
    ]);
  });

  it('deve retornar uma lista vazia quando não existem permissões cadastradas', async () => {
    mockConsultas([[{ perfilid: 8 }], [], []]);
    await expect(service.carregar(3)).resolves.toEqual([]);
  });

  it('deve interromper a consulta quando o usuário não existe', async () => {
    const query = mockConsultas([[]]);
    await expect(service.carregar(3)).rejects.toBeInstanceOf(NotFoundException);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
