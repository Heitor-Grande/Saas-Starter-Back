export type SolicitarRecuperacaoSenhaDto = {
  email: string;
};

export type ValidarCodigoRecuperacaoDto = {
  token: string;
  codigo: string;
};

export type RedefinirSenhaDto = {
  token: string;
  senha: string;
  confirmarSenha: string;
};

export type TokenRecuperacaoResponseDto = {
  token: string;
  expiraEmSegundos: number;
};
