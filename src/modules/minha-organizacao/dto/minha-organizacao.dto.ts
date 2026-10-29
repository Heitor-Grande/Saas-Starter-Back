export type OpcaoOrganizacaoDto = {
  id: number;
  nome: string;
};

export type MinhaOrganizacaoDto = {
  id: number;
  nome: string;
  cnpj: string;
  planoid: number;
  plano: string;
  usuarioresponsavelid: number | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  usuarios: OpcaoOrganizacaoDto[];
  planos: OpcaoOrganizacaoDto[];
};

export type UpdateMinhaOrganizacaoDto = {
  nome: string;
  cnpj: string;
  planoid: number;
  usuarioresponsavelid: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
};
