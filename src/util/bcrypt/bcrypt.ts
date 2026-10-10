import { compareSync, hashSync } from 'bcrypt';

export type GeneratedHash = {
  saltRounds: number;
  hash: string;
};

/**
 * Gera um hash bcrypt para proteger um valor sensível antes de armazená-lo.
 * @param value Valor que será transformado em hash.
 * @param saltRounds Quantidade de rodadas usada pelo bcrypt.
 * @returns O hash gerado e a quantidade de rodadas utilizada.
 */
export function generateHash(value: string, saltRounds: number): GeneratedHash {
  return {
    saltRounds,
    hash: hashSync(value, saltRounds),
  };
}

/**
 * Compara um valor com um hash bcrypt para confirmar se eles correspondem.
 * @param value Valor original que será validado.
 * @param hash Hash bcrypt usado na comparação.
 * @returns true quando o valor corresponder ao hash ou false quando não corresponder.
 */
export function validateHash(value: string, hash: string): boolean {
  return compareSync(value, hash);
}
