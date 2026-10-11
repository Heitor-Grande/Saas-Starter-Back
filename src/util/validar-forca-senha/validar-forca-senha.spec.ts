import { validarForcaSenha } from './validar-forca-senha';

describe('validarForcaSenha', () => {
  it('aceita senha que atende todos os requisitos', () => {
    expect(validarForcaSenha('Senha1!')).toBe(true);
  });

  it.each(['Ab1!', 'senha1!', 'SENHA!', 'Senha1', 12345, undefined])(
    'rejeita senha invalida: %p',
    (senha) => {
      expect(validarForcaSenha(senha)).toBe(false);
    },
  );
});
