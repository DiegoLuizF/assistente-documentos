export class ErroAmigavel extends Error {}

export function erroAmigavel(mensagem) {
  return new ErroAmigavel(mensagem);
}
