// Servidor sem estado: o frontend reenvia o PDF a cada chamada, mas o texto
// extraído fica em cache por hash do arquivo para não reprocesar o mesmo PDF
// a cada pergunta do chat. Cache volátil: some quando o servidor reinicia.
const MAX_ITENS = 8;
const cache = new Map();

export function obterDoCache(chave) {
  if (!cache.has(chave)) return undefined;
  const valor = cache.get(chave);
  cache.delete(chave);
  cache.set(chave, valor);
  return valor;
}

export function guardarNoCache(chave, valor) {
  if (cache.has(chave)) cache.delete(chave);
  cache.set(chave, valor);
  while (cache.size > MAX_ITENS) {
    cache.delete(cache.keys().next().value);
  }
}
