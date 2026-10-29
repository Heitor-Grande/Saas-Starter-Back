export type UsuarioDto = {
  id: number;
  nome: string;
  nomesocial: string | null;
  cpf: string;
  datanascimento: string;
  email: string;
  telefone: string;
  perfilid: number;
  perfil: string;
  cargo: string | null;
  ativo: boolean;
  datacriacao: Date;
};

export type PerfilOpcaoDto = {
  id: number;
  nome: string;
};

export type UsuarioFormularioDto = UsuarioDto & {
  perfis: PerfilOpcaoDto[];
};

export type CreateUsuarioDto = {
  nome: string;
  nomesocial?: string | null;
  cpf: string;
  datanascimento: string;
  email: string;
  telefone: string;
  perfilid: number;
  cargo?: string | null;
  ativo: boolean;
  senha: string;
};

export type UpdateUsuarioDto = Omit<CreateUsuarioDto, 'senha'>;
