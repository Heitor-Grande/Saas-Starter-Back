export type MeuUsuarioDto = {
  id: number;
  nome: string;
  nomesocial: string | null;
  cpf: string;
  datanascimento: string;
  email: string;
  telefone: string;
  ativo: boolean;
  organizacao: string;
  perfil: string;
  cargo: string | null;
};
