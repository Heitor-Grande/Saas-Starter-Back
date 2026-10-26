export type UpdateConfiguracaoGlobalDto = {
  nome_aplicacao: string;
  email_suporte?: string | null;
  smtp_servidor?: string | null;
  smtp_porta?: number | null;
  smtp_usuario?: string | null;
  smtp_senha?: string | null;
  smtp_remetente_nome?: string | null;
  smtp_remetente_email?: string | null;
};

export type ConfiguracaoGlobalDto = UpdateConfiguracaoGlobalDto & {
  id: 1;
  criado_em: Date;
  atualizado_em: Date;
  atualizadoporusuarioid: number | null;
};
