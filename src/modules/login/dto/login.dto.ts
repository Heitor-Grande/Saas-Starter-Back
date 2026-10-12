export type LoginRequestDto = {
  email: string;
  senha: string;
};

export type LoginResponseDto = {
  token: string;
};

export type LoginUsuarioDto = {
  id: number;
  email: string;
  organizacaoid: number;
  ativo: boolean;
  senhahash: string;
};
