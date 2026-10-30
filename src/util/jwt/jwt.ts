import 'dotenv/config';
import { decode, sign, verify } from 'jsonwebtoken';
import type { JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string;

if (!jwtSecret) {
  throw new Error('JWT_SECRET precisa ser definida no arquivo .env');
}

export type JwtPayload = {
  usuarioid: number;
  datalogin: string;
  organizacaoid: number;
  iat?: number;
  exp?: number;
};

/**
 * Gera um JWT para autenticar um payload por um período determinado.
 * @param payload Dados que serão armazenados no token.
 * @param expiresInSeconds Tempo de validade do token em segundos.
 * @returns O JWT criado.
 */
export function generateJwt(
  payload: JwtPayload,
  expiresInSeconds: number,
): string {
  return sign(payload, jwtSecret, { expiresIn: expiresInSeconds });
}

/**
 * Valida um JWT para confirmar sua assinatura e expiração.
 * @param token JWT que será validado.
 * @returns true quando o token for válido ou false quando for inválido.
 */
export function validateJwt(token: string): boolean {
  try {
    verify(token, jwtSecret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extrai os dados de um JWT previamente validado para separar leitura e validação.
 * @param token JWT cujo payload será extraído.
 * @returns O payload do token ou null quando ele não contiver um objeto válido.
 */
export function getJwtPayload(token: string): JwtPayload | null {
  const payload = decode(token);

  return payload !== null && typeof payload === 'object'
    ? (payload as JwtPayload)
    : null;
}

/** Valida a assinatura e devolve o payload de tokens de finalidade específica. */
export function verifyJwtPayload<T extends JsonWebTokenPayload>(
  token: string,
): T | null {
  try {
    const payload = verify(token, jwtSecret);
    return typeof payload === 'object' ? (payload as T) : null;
  } catch {
    return null;
  }
}

/** Assina um payload de finalidade específica com expiração obrigatória. */
export function signJwtPayload<T extends object>(
  payload: T,
  expiresInSeconds: number,
): string {
  return sign(payload, jwtSecret, { expiresIn: expiresInSeconds });
}
