import { descriptografar, criptografar } from './nodeCrypto';
import 'dotenv/config';

describe('nodeCrypto', () => {
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

  const chaveOriginal = process.env.NODE_CRYPTO_KEY;

  beforeEach(() => {
    process.env.NODE_CRYPTO_KEY = Buffer.alloc(32, 7).toString('base64');
  });

  afterAll(() => {
    if (chaveOriginal === undefined) delete process.env.NODE_CRYPTO_KEY;
    else process.env.NODE_CRYPTO_KEY = chaveOriginal;
  });

  it('deve criptografar e descriptografar um texto', () => {
    const texto = 'Informação confidencial';
    const criptografado = criptografar(texto);

    expect(criptografado).not.toBe(texto);
    expect(descriptografar(criptografado)).toBe(texto);
  });

  it('deve produzir resultados diferentes para o mesmo texto', () => {
    expect(criptografar('segredo')).not.toBe(criptografar('segredo'));
  });

  it('deve rejeitar um texto criptografado adulterado', () => {
    const criptografado = criptografar('segredo');
    const adulterado = `${criptografado.slice(0, -1)}A`;

    expect(() => descriptografar(adulterado)).toThrow();
  });

  it('deve exigir uma chave Base64 de 32 bytes', () => {
    process.env.NODE_CRYPTO_KEY = Buffer.alloc(16).toString('base64');

    expect(() => criptografar('segredo')).toThrow(
      'A variável NODE_CRYPTO_KEY deve conter uma chave Base64 de 32 bytes.',
    );
  });

  it('deve aceitar somente textos não vazios', () => {
    expect(() => criptografar('')).toThrow(TypeError);
  });
});
