/** Verifica se a senha atende aos requisitos minimos de seguranca. */
export function validarForcaSenha(senha: unknown): senha is string {
  return (
    typeof senha === 'string' &&
    senha.length >= 5 &&
    /\d/.test(senha) &&
    /[A-Z]/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  );
}
