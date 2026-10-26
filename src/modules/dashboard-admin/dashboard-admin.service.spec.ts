import { mockConsultas } from '../../test/helpers/postgres-mock';
import { DashboardAdminService } from './dashboard-admin.service';

describe('Serviço do dashboard administrativo', () => {
  const service = new DashboardAdminService();

  afterEach(() => jest.restoreAllMocks());

  it('deve retornar os totais e as distribuições usando consultas independentes', async () => {
    const usuariosPorOrganizacao = [
      { organizacaoid: 1, organizacao: 'Empresa Alpha', totalusuarios: 8 },
      { organizacaoid: 2, organizacao: 'Empresa Beta', totalusuarios: 4 },
    ];
    const usuariosPorPerfil = [
      { perfilid: 1, perfil: 'Administrador', totalusuarios: 2 },
      { perfilid: 2, perfil: 'Usuário', totalusuarios: 10 },
    ];
    const query = mockConsultas([
      [{ total: 12 }],
      [{ total: 3 }],
      [{ total: 2 }],
      usuariosPorOrganizacao,
      usuariosPorPerfil,
    ]);

    await expect(service.findAll()).resolves.toEqual({
      totalusuarios: 12,
      usuariosinativos: 3,
      totalorganizacoes: 2,
      usuariospororganizacao: usuariosPorOrganizacao,
      usuariosporperfil: usuariosPorPerfil,
    });
    expect(query).toHaveBeenCalledTimes(5);
    expect(query.mock.calls[1][0]).toContain('WHERE ativo = false');
    expect(query.mock.calls[3][0]).toContain('GROUP BY organizacoes.id');
    expect(query.mock.calls[4][0]).toContain('GROUP BY perfis.id');
  });

  it('deve retornar zero quando as consultas de totais não possuírem linhas', async () => {
    mockConsultas([[], [], [], [], []]);
    await expect(service.findAll()).resolves.toEqual({
      totalusuarios: 0,
      usuariosinativos: 0,
      totalorganizacoes: 0,
      usuariospororganizacao: [],
      usuariosporperfil: [],
    });
  });
});
