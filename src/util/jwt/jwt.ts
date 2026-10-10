import 'dotenv/config';
import { decode, sign, verify, type JwtPayload } from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string;

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be defined in the .env file.');
}

/**
 * Gera um JWT para autenticar um payload por um período determinado.
 * @param payload Dados que serão armazenados no token.
 * @param expiresInSeconds Tempo de validade do token em segundos.
 * @returns O JWT criado.
 */
export function generateJwt(payload: object, expiresInSeconds: number): string {
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

  return payload !== null && typeof payload === 'object' ? payload : null;
}
