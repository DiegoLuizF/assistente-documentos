const MAX_CATEGORIAS_DISTINTAS = 1000;
const MAX_LINHAS_AMOSTRA = 30;
const MAX_CELULAS_PARA_CALCULO = 500_000;

function valorNumerico(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function analisarTabela(nome, linhasBrutas) {
  const colunas = [];
  const vistas = new Set();
  for (const linha of linhasBrutas) {
    for (const chave of Object.keys(linha)) {
      if (chave && !vistas.has(chave)) {
        vistas.add(chave);
        colunas.push(chave);
      }
    }
  }

  const info = new Map(
    colunas.map((coluna) => [
      coluna,
      { numericos: 0, textos: 0, soma: 0, min: Infinity, max: -Infinity, categorias: new Map(), categoriasTruncadas: false },
    ])
  );

  for (const linha of linhasBrutas) {
    for (const coluna de colunas) {
      const valor = linha[coluna];
      if (valor === null || valor === undefined || valor === '') continue;
      const item = info.get(coluna);
      const numero = valorNumerico(valor);
      if (numero !== null) {
        item.numericos++;
        item.soma += numero;
        item.min = Math.min(item.min, numero);
        item.max = Math.max(item.max, numero);
      } else {
        item.textos++;
        const texto = String(valor).trim();
        if (item.categorias.size >= MAX_CATEGORIAS_DISTINTAS) {
          item.categoriasTruncadas = true;
        } else {
          item.categorias.set(texto, (item.categorias.get(texto) ?? 0) + 1);
        }
      }
    }
  }

  const perfil = colunas.map((coluna) => {
    const item = info.get(coluna);
    const numerica = item.numericos >= item.textos;
    const base = { coluna, tipo: numerica ? 'numérica' : 'texto', vazios: linhasBrutas.length - item.numericos - item.textos };
    if (numerica && item.numericos > 0) {
      return { ...base, soma: item.soma, media: item.soma / item.numericos, min: item.min, max: item.max };
    }
    const top = [...item.categorias.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      ...base,
      distintos: item.categorias.size,
      categoriasTruncadas: item.categoriasTruncadas,
      maisFrequentes: top.map(([valor, contagem]) => ({ valor, contagem })),
    };
  });

  const celulas = linhasBrutas.length * colunas.length;
  const manterLinhas = celulas <= MAX_CELULAS_PARA_CALCULO;

  return {
    nome,
    colunas,
    totalLinhas: linhasBrutas.length,
    perfil,
    amostra: linhasBrutas.slice(0, MAX_LINHAS_AMOSTRA),
    linhas: manterLinhas ? linhasBrutas : null,
  };
}

export function contextoDasTabelas(tabelas) {
  const partes = tabelas.map((tabela) => {
    const linhas = [
      `ABA "${tabela.nome}": ${tabela.totalLinhas} linhas de dados, ${tabela.colunas.length} colunas.`,
    ];
    for (const coluna of tabela.perfil) {
      if (coluna.tipo === 'numérica') {
        linhas.push(
          `- Coluna "${coluna.coluna}" (numérica): soma ${coluna.soma}, média ${coluna.media}, mínimo ${coluna.min}, máximo ${coluna.max}.`
        );
      } else {
        const frequentes = coluna.maisFrequentes
          .map(({ valor, contagem }) => `${valor} (${contagem})`)
          .join(', ');
        const aviso = coluna.categoriasTruncadas ? ' (contagem de categorias truncada)' : '';
        linhas.push(
          `- Coluna "${coluna.coluna}" (texto): ${coluna.distintos} valores distintos${aviso}; mais frequentes: ${frequentes || 'nenhum'}.`
        );
      }
    }
    linhas.push(`Amostra das primeiras ${tabela.amostra.length} linhas:`);
    linhas.push(tabela.colunas.join(' | '));
    for (const linha of tabela.amostra) {
      linhas.push(tabela.colunas.map((c) => String(linha[c] ?? '')).join(' | '));
    }
    return linhas.join('\n');
  });
  return partes.join('\n\n');
}
