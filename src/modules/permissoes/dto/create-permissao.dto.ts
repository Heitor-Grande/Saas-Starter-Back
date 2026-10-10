export type CreatePermissaoDto = {
  nome: string;
  descricao: string;
};

export type PermissaoDto = {
  id: number;
  nome: string;
  descricao: string;
  criadoporusuarioid: number;
  datacriacao: Date;
  atualizadoporusuarioid: number;
  atualizadoem: Date;
};
