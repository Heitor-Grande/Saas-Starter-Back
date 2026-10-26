export type TotalDto = {
  total: number;
};

export type UsuariosPorOrganizacaoDto = {
  organizacaoid: number;
  organizacao: string;
  totalusuarios: number;
};

export type UsuariosPorPerfilDto = {
  perfilid: number;
  perfil: string;
  totalusuarios: number;
};

export type DashboardAdminDto = {
  totalusuarios: number;
  usuariosinativos: number;
  totalorganizacoes: number;
  usuariospororganizacao: UsuariosPorOrganizacaoDto[];
  usuariosporperfil: UsuariosPorPerfilDto[];
};
