const OPERACOES = new Set(['soma', 'media', 'minimo', 'maximo', 'contar']);
const MAX_PEDIDOS = 5;

function mesmoValor(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}

function calcularSobre(linhas, coluna, operacao, filtro) {
  const valores = [];
  let contagem = 0;

  for (const linha of linhas) {
    if (filtro && !mesmoValor(linha[filtro.coluna], filtro.valor)) continue;
    contagem++;
    if (operacao !== 'contar') {
      const bruto = linha[coluna];
      if (bruto === null || bruto === undefined || bruto === '') continue;
      const numero = typeof bruto === 'number' ? bruto : Number(bruto);
      if (Number.isFinite(numero)) valores.push(numero);
    }
  }

  if (operacao === 'contar') return contagem;
  if (valores.length === 0) return null;
  if (operacao === 'soma') return valores.reduce((a, b) => a + b, 0);
  if (operacao === 'media') return valores.reduce((a, b) => a + b, 0) / valores.length;
  if (operacao === 'minimo') return Math.min(...valores);
  if (operacao === 'maximo') return Math.max(...valores);
  return null;
}

/**
 * Executa pedidos de cálculo do modelo sobre as tabelas retidas em cache.
 * Devolve linhas de texto prontas para entrar no prompt da segunda chamada.
 */
export function executarCalculos(tabelas, pedidos) {
  if (!Array.isArray(pedidos)) return ['Nenhum cálculo válido foi solicitado.'];

  const resultados = [];
  for (const pedido of pedidos.slice(0, MAX_PEDIDOS)) {
    if (!pedido || !OPERACOES.has(pedido.operacao) || typeof pedido.coluna !== 'string' || !pedido.coluna.trim()) {
      resultados.push('Pedido de cálculo inválido (use operacao, coluna e, opcionalmente, aba e filtro).');
      continue;
    }

    const filtro =
      pedido.filtro && typeof pedido.filtro.coluna === 'string' ? { coluna: pedido.filtro.coluna, valor: pedido.filtro.valor } : null;

    const alvos = tabelas.filter(
      (t) =>
        Array.isArray(t.linhas) &&
        (!pedido.aba || t.nome === pedido.aba) &&
        t.colunas.includes(pedido.coluna) &&
        (!filtro || t.colunas.includes(filtro.coluna))
    );

    if (alvos.length === 0) {
      resultados.push(`Cálculo de "${pedido.coluna}" (${pedido.operacao}): coluna ou aba não encontrada nos dados disponíveis.`);
      continue;
    }

    for (const tabela of alvos.slice(0, 2)) {
      const valor = calcularSobre(tabela.linhas, pedido.coluna, pedido.operacao, filtro);
      const rotulo = `${tabela.nome}.${pedido.coluna} ${pedido.operacao}${filtro ? ` quando ${filtro.coluna} = ${filtro.valor}` : ''}`;
      resultados.push(valor === null ? `${rotulo}: nenhum valor numérico encontrado.` : `${rotulo}: ${valor}`);
    }
  }
  return resultados;
}
