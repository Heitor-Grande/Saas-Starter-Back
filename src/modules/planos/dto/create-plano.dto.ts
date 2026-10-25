export type CreatePlanoDto = {
  nome: string;
  valor: number;
  descricao: string;
};

export type PlanoDto = {
  id: number;
  nome: string;
  valor: string;
  descricao: string;
  criadoporusuarioid: number;
  datacriacao: Date;
  atualizadoem: Date;
  atualizadoporusuarioid: number;
};
