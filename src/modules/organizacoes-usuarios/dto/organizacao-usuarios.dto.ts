export type UsuarioDaOrganizacaoDto = {
  id: number;
  nome: string;
  perfil: string;
  ativo: boolean;
};

export type OrganizacaoComUsuariosDto = {
  id: number;
  nome: string;
  plano: string;
  usuarios: UsuarioDaOrganizacaoDto[];
};
