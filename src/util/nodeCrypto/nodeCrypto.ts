import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import 'dotenv/config';

if (
  !process.env.CRYPTO_ALGORITHM ||
  !process.env.CRYPTO_RANDONBYTES ||
  !process.env.CRYPTO_TAMANHOCHAVE ||
  !process.env.CRYPTO_SEPARADOR ||
  !process.env.NODE_CRYPTO_KEY
) {
  throw new Error(
    'As variáveis de ambiente CRYPTO_ALGORITHM, CRYPTO_RANDONBYTES, CRYPTO_TAMANHOCHAVE, CRYPTO_SEPARADOR e NODE_CRYPTO_KEY devem estar definidas.',
  );
}

if (process.env.CRYPTO_ALGORITHM !== 'aes-256-gcm') {
  throw new Error(
    'A variável de ambiente CRYPTO_ALGORITHM deve ser "aes-256-gcm".',
  );
}

const ALGORITMO = process.env.CRYPTO_ALGORITHM;
const TAMANHO_IV = parseInt(process.env.CRYPTO_RANDONBYTES, 10);
const TAMANHO_CHAVE = parseInt(process.env.CRYPTO_TAMANHOCHAVE, 10);
const SEPARADOR = process.env.CRYPTO_SEPARADOR;

/**
 * Criptografa um texto usando AES-256-GCM e uma chave definida no ambiente.
 * @param informacao Texto que deve ser protegido.
 * @returns Texto com versão, IV, tag de autenticação e conteúdo criptografado.
 */
export function criptografar(informacao: string): string {
  validarTexto(informacao);
  const chave = obterChave();
  const iv = randomBytes(TAMANHO_IV);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const conteudo = Buffer.concat([
    cipher.update(informacao, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    conteudo.toString('base64url'),
  ].join(SEPARADOR);
}

/**
 * Descriptografa um texto produzido pela função criptografar.
 * @param informacao Texto criptografado contendo versão, IV, tag e conteúdo.
 * @returns O texto original descriptografado.
 */
export function descriptografar(informacao: string): string {
  validarTexto(informacao);
  const partes = informacao.split(SEPARADOR);

  if (partes.length !== 4 || partes[0] !== 'v1') {
    throw new Error('O texto criptografado possui formato inválido.');
  }

  const [, ivBase64, tagBase64, conteudoBase64] = partes;
  const iv = Buffer.from(ivBase64, 'base64url');
  const tag = Buffer.from(tagBase64, 'base64url');
  const conteudo = Buffer.from(conteudoBase64, 'base64url');

  if (iv.length !== TAMANHO_IV || tag.length !== 16) {
    throw new Error('O texto criptografado possui formato inválido.');
  }

  const decipher = createDecipheriv(ALGORITMO, obterChave(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(conteudo), decipher.final()]).toString(
    'utf8',
  );
}

/** Obtém e valida a chave Base64 de 32 bytes configurada para criptografia. */
function obterChave(): Buffer {
  const chaveBase64 = process.env.NODE_CRYPTO_KEY;

  if (!chaveBase64) {
    throw new Error(
      'A variável de ambiente NODE_CRYPTO_KEY não está definida.',
    );
  }

  const chave = Buffer.from(chaveBase64, 'base64');

  if (chave.length !== TAMANHO_CHAVE) {
    throw new Error(
      'A variável NODE_CRYPTO_KEY deve conter uma chave Base64 de 32 bytes.',
    );
  }

  return chave;
}

/** Valida que a informação recebida é um texto não vazio. */
function validarTexto(informacao: string): void {
  if (typeof informacao !== 'string' || informacao.length === 0) {
    throw new TypeError('A informação deve ser um texto não vazio.');
  }
}
