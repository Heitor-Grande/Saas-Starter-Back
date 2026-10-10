export type ApiResponse<T = unknown> = {
  statusCode: number;
  message: string;
  data?: T;
};

/**
 * Padroniza o corpo das respostas da API para manter um único formato.
 * @param message Mensagem que descreve o resultado da operação.
 * @param statusCode Código HTTP associado à resposta.
 * @param data Dados opcionais retornados pela operação.
 * @returns O corpo padronizado da resposta da API.
 */
export function createApiResponse<T = unknown>(
  message: string,
  statusCode: number,
  data?: T,
): ApiResponse<T> {
  return data === undefined
    ? { statusCode, message }
    : { statusCode, message, data };
}
