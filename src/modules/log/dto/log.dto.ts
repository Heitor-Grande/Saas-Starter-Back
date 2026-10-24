export type LogDto = {
  id: number;
  organizacaoid: number;
  organizacaonome: string;
  feitoporusuarioid: number;
  usuarionome: string;
  usuarioemail: string;
  perfil: string;
  feitoem: Date;
  acao: string;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
};
