import { generateJwt, getJwtPayload, validateJwt } from './jwt';

describe('Utilitário de JWT', () => {
  it('deve gerar e validar um JWT', () => {
    const token = generateJwt({ sub: 'user-1' }, 60);

    expect(validateJwt(token)).toBe(true);
  });

  it('deve rejeitar um token com assinatura inválida', () => {
    const token = generateJwt({ sub: 'user-1' }, 60);
    const [header, payload, signature] = token.split('.');
    const tamperedSignature = `${signature.startsWith('x') ? 'y' : 'x'}${signature.slice(1)}`;
    const tamperedToken = `${header}.${payload}.${tamperedSignature}`;

    expect(validateJwt(tamperedToken)).toBe(false);
  });

  it('deve retornar o payload de um JWT válido', () => {
    const token = generateJwt({ sub: 'user-1' }, 60);

    expect(validateJwt(token)).toBe(true);
    expect(getJwtPayload(token)).toMatchObject({ sub: 'user-1' });
  });
});
