export function extrairPrimeiroObjetoJson(texto) {
  const semCercas = texto.replace(/```[a-zA-Z]*\s*/g, '');
  const inicio = semCercas.indexOf('{');
  const fim = semCercas.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) {
    throw new Error('Nenhum objeto JSON encontrado na resposta.');
  }
  return JSON.parse(semCercas.slice(inicio, fim + 1));
}

export function validarAnalise(dados) {
  if (!dados || typeof dados.resumo !== 'string' || !dados.resumo.trim()) return null;
  if (!Array.isArray(dados.topicos) || dados.topicos.length === 0) return null;

  const topicos = dados.topicos
    .filter((t) => t && typeof t.titulo === 'string' && t.titulo.trim())
    .map((t, indice) => ({
      id: typeof t.id === 'string' && t.id.trim() ? t.id.trim() : `topico-${indice + 1}`,
      titulo: t.titulo.trim(),
      detalhe: typeof t.detalhe === 'string' ? t.detalhe.trim() : '',
    }));

  if (topicos.length === 0) return null;
  return { resumo: dados.resumo.trim(), topicos };
}

export function transformarAnalise(textoBruto) {
  const dados = validarAnalise(extrairPrimeiroObjetoJson(textoBruto));
  if (!dados) {
    throw new Error('A resposta do modelo não tem a estrutura esperada.');
  }
  return dados;
}
