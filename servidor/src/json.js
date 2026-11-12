const TIPOS_GRAFICO = new Set(['barras', 'linhas', 'pizza']);
const MAX_PONTOS_GRAFICO = 12;
const MAX_GRAFICOS = 3;
const MAX_EXPLICACAO = 300;

export function extrairPrimeiroObjetoJson(texto) {
  const semCercas = texto.replace(/```[a-zA-Z]*\s*/g, '');
  const inicio = semCercas.indexOf('{');
  const fim = semCercas.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) {
    throw new Error('Nenhum objeto JSON encontrado na resposta.');
  }
  return JSON.parse(semCercas.slice(inicio, fim + 1));
}

export function validarGraficos(graficos) {
  if (!Array.isArray(graficos)) return [];

  return graficos
    .filter(
      (g) =>
        g &&
        TIPOS_GRAFICO.has(g.tipo) &&
        typeof g.titulo === 'string' &&
        g.titulo.trim() &&
        Array.isArray(g.dados)
    )
    .slice(0, MAX_GRAFICOS)
    .map((g, indice) => ({
      id: typeof g.id === 'string' && g.id.trim() ? g.id.trim() : `grafico-${indice + 1}`,
      tipo: g.tipo,
      titulo: g.titulo.trim(),
      explicacao: typeof g.explicacao === 'string' ? g.explicacao.trim().slice(0, MAX_EXPLICACAO) : '',
      dados: g.dados
        .filter((d) => d && typeof d.rotulo === 'string' && d.rotulo.trim() && Number.isFinite(Number(d.valor)))
        .slice(0, MAX_PONTOS_GRAFICO)
        .map((d) => ({ rotulo: d.rotulo.trim(), valor: Number(d.valor) })),
    }))
    .filter((g) => g.dados.length >= 2);
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
  return {
    resumo: dados.resumo.trim(),
    topicos,
    graficos: validarGraficos(dados.graficos),
  };
}

export function transformarAnalise(textoBruto) {
  const dados = validarAnalise(extrairPrimeiroObjetoJson(textoBruto));
  if (!dados) {
    throw new Error('A resposta do modelo não tem a estrutura esperada.');
  }
  return dados;
}

const OPERACOES_CALCULO = new Set(['soma', 'media', 'minimo', 'maximo', 'contar']);

/**
 * Interpreta a primeira resposta do modelo no chat, que pode ser texto puro,
 * um pedido de cálculo ou um pedido de gráfico. Devolve null para texto puro.
 */
export function interpretarRespostaChat(textoBruto) {
  let dados;
  try {
    dados = extrairPrimeiroObjetoJson(textoBruto);
  } catch {
    return null;
  }
  if (!dados || typeof dados !== 'object') return null;

  if (Array.isArray(dados.calcular)) {
    const pedidos = dados.calcular.filter(
      (p) => p && OPERACOES_CALCULO.has(p.operacao) && typeof p.coluna === 'string' && p.coluna.trim()
    );
    return pedidos.length > 0 ? { tipo: 'calcular', pedidos } : null;
  }

  if (typeof dados.responder === 'string' && dados.responder.trim()) {
    const graficos = Array.isArray(dados.graficos) ? validarGraficos(dados.graficos) : [];
    if (graficos.length > 0) {
      return { tipo: 'graficos', resposta: dados.responder.trim(), graficos };
    }
    // O modelo tentou o formato mas os gráficos vieram inválidos; aproveita o
    // texto para o JSON bruto não vazar como resposta.
    return { tipo: 'texto', resposta: dados.responder.trim() };
  }

  return null;
}
