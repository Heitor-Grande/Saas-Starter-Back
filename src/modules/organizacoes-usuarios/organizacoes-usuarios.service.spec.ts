import { mockConsultas } from '../../test/helpers/postgres-mock';
import { OrganizacoesUsuariosService } from './organizacoes-usuarios.service';

describe('Serviço de organizações e usuários', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve agrupar os usuários nas respectivas organizações', async () => {
    const organizacoesUsuarios = [
      {
        organizacaoid: 1,
        organizacaonome: 'Empresa Alpha',
        plano: 'Growth',
        usuarioid: 10,
        usuarionome: 'Ana Silva',
        perfil: 'Administrador',
        usuarioativo: true,
      },
      {
        organizacaoid: 1,
        organizacaonome: 'Empresa Alpha',
        plano: 'Growth',
        usuarioid: 11,
        usuarionome: 'Bruno Souza',
        perfil: 'Gestor',
        usuarioativo: false,
      },
      {
        organizacaoid: 2,
        organizacaonome: 'Empresa Beta',
        plano: 'Starter',
        usuarioid: null,
        usuarionome: null,
        perfil: null,
        usuarioativo: null,
      },
    ];
    const query = mockConsultas([organizacoesUsuarios]);
    const service = new OrganizacoesUsuariosService();

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 1,
        nome: 'Empresa Alpha',
        plano: 'Growth',
        usuarios: [
          { id: 10, nome: 'Ana Silva', perfil: 'Administrador', ativo: true },
          { id: 11, nome: 'Bruno Souza', perfil: 'Gestor', ativo: false },
        ],
      },
      {
        id: 2,
        nome: 'Empresa Beta',
        plano: 'Starter',
        usuarios: [],
      },
    ]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve retornar uma lista vazia quando não houver organizações', async () => {
    mockConsultas([[]]);
    const service = new OrganizacoesUsuariosService();

    await expect(service.findAll()).resolves.toEqual([]);
  });
});
