export type UpdateMeuUsuarioDto = {
  nome: string;
  nomesocial?: string | null;
  cpf: string;
  datanascimento: string;
  email: string;
  telefone: string;
  cargo?: string | null;
  ativo: boolean;
};
