import { generateHash, validateHash } from './bcrypt';

describe('Utilitário de bcrypt', () => {
  it('deve gerar e retornar o hash com a quantidade de rodadas', () => {
    const result = generateHash('senha-segura', 4);

    expect(result.saltRounds).toBe(4);
    expect(result.hash).not.toBe('senha-segura');
  });

  it('deve retornar verdadeiro quando o valor corresponder ao hash', () => {
    const result = generateHash('senha-segura', 4);

    expect(validateHash('senha-segura', result.hash)).toBe(true);
  });

  it('deve retornar falso quando o valor não corresponder ao hash', () => {
    const result = generateHash('senha-segura', 4);

    expect(validateHash('senha-incorreta', result.hash)).toBe(false);
  });
});
