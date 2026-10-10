export type CreatePerfilDto = {
  nome: string;
  descricao: string;
};

export type PerfilDto = {
  id: number;
  nome: string;
  descricao: string;
  criadoporusuarioid: number;
  datacriacao: Date;
  atualizadoporusuarioid: number;
  atualizadoem: Date;
};
