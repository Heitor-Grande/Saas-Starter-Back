export type CreateCadastroInicialDto = {
  organizacao: CreateCadastroInicialOrganizacaoDto;
  usuario: CreateCadastroInicialUsuarioDto;
};

export type CreateCadastroInicialOrganizacaoDto = {
  nome: string;
  cnpj: string;
  planoid: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export type CreateCadastroInicialUsuarioDto = {
  nome: string;
  nomesocial?: string;
  cpf: string;
  datanascimento: string;
  email: string;
  telefone: string;
  perfilid: number;
  cargo?: string;
  ativo?: boolean;
  senha: string;
};

export type CadastroInicialOrganizacaoDto =
  CreateCadastroInicialOrganizacaoDto & {
    id: number;
    usuarioresponsavelid: number;
    criadoporusuarioid: number;
    datacriacao: Date;
    atualizadoem: Date;
    atualizadoporusuarioid: number;
  };

export type CadastroInicialUsuarioDto = Omit<
  CreateCadastroInicialUsuarioDto,
  'senha'
> & {
  id: number;
  organizacaoid: number;
  ativo: boolean;
  datacriacao: Date;
};

export type CadastroInicialDto = {
  organizacao: CadastroInicialOrganizacaoDto;
  usuario: CadastroInicialUsuarioDto;
};
