import ExcelJS from 'exceljs';
import { analisarTabela, contextoDasTabelas } from '../tabelas.js';
import { erroAmigavel } from '../erros.js';

const MAX_COLUNAS = 60;

function valorDaCelula(celula) {
  if (celula === null || celula === undefined) return '';
  if (celula instanceof Date) return celula.toISOString().slice(0, 10);
  if (typeof celula === 'object') {
    if (Array.isArray(celula.richText)) return celula.richText.map((t) => t.text).join('');
    if ('result' in celula) return valorDaCelula(celula.result);
    if (typeof celula.text === 'string') return celula.text;
    return '';
  }
  return celula;
}

function valoresDaLinha(linha) {
  const valores = [];
  const total = Math.min(linha.cellCount, MAX_COLUNAS);
  for (let c = 1; c <= total; c++) {
    valores.push(valorDaCelula(linha.getCell(c).value));
  }
  return valores;
}

function preenchidas(valores) {
  return valores.filter((v) => String(v).trim() !== '');
}

function ehNumerico(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor);
  if (typeof valor !== 'string' || valor.trim() === '') return false;
  return Number.isFinite(Number(valor));
}

// Planilhas reais raramente são uma tabela limpa: têm linhas de título, notas e
// vários blocos na mesma aba. Este extrator separa blocos por linhas vazias,
// acha o cabeçalho de cada bloco (mesclando cabeçalhos de dois níveis) e só
// converte em tabela o que tiver cara de dados.
function blocosDaPlanilha(planilha) {
  const linhasPorNumero = [];
  planilha.eachRow((linha, numero) => {
    linhasPorNumero[numero] = valoresDaLinha(linha);
  });

  const blocos = [];
  let blocoAtual = [];
  for (let i = 1; i <= linhasPorNumero.length; i++) {
    const valores = linhasPorNumero[i];
    if (!valores || preenchidas(valores).length === 0) {
      if (blocoAtual.length > 0) blocos.push(blocoAtual);
      blocoAtual = [];
      continue;
    }
    blocoAtual.push({ numero: i, valores });
  }
  if (blocoAtual.length > 0) blocos.push(blocoAtual);
  return blocos;
}

function dominanciaTexto(valores) {
  const cheias = preenchidas(valores);
  if (cheias.length < 3) return false;
  const textos = cheias.filter((v) => !ehNumerico(v)).length;
  return textos / cheias.length >= 0.6;
}

function dominanciaNumerica(valores) {
  const cheias = preenchidas(valores);
  if (cheias.length < 3) return false;
  const numericas = cheias.filter((v) => ehNumerico(v)).length;
  return numericas / cheias.length >= 0.5;
}

function nomeUnico(nomes, nome) {
  const base = nome.trim() === '' ? `Coluna ${nomes.length + 1}` : nome.trim();
  let final = base;
  let copia = 2;
  while (nomes.includes(final)) {
    final = `${base} (${copia})`;
    copia++;
  }
  return final;
}

function cabecalhoEBloco(bloco) {
  for (let i = 0; i < bloco.length; i++) {
    const atual = bloco[i].valores;
    if (!dominanciaTexto(atual)) continue;

    const proxima = bloco[i + 1];
    if (!proxima) break;

    if (dominanciaNumerica(proxima.valores)) {
      return { cabecalhos: [atual], inicioDados: i + 1 };
    }

    // Cabeçalho de dois níveis: a linha seguinte também é texto e a de depois
    // tem dados — mescla "grupo · subgrupo" para dar nomes completos às colunas.
    const seguinte = bloco[i + 2];
    if (dominanciaTexto(proxima.valores) && seguinte && dominanciaNumerica(seguinte.valores)) {
      return { cabecalhos: [atual, proxima.valores], inicioDados: i + 2 };
    }
  }
  return null;
}

function tituloDoBloco(bloco) {
  for (const linha of bloco) {
    const texto = preenchidas(linha.valores)
      .map((v) => String(v).trim())
      .find((v) => v.length > 3 && !ehNumerico(v));
    if (texto) return texto.slice(0, 60);
  }
  return null;
}

function tabelaDoBloco(nomePlanilha, bloco) {
  const achado = cabecalhoEBloco(bloco);
  if (!achado) return null;

  const nomes = [];
  const totalColunas = Math.max(...achado.cabecalhos.map((c) => c.length));
  for (let c = 0; c < totalColunas; c++) {
    const grupo = String(achado.cabecalhos[0][c] ?? '').trim();
    const sub = achado.cabecalhos[1] ? String(achado.cabecalhos[1][c] ?? '').trim() : '';
    const combinado = grupo && sub && grupo !== sub ? `${grupo} · ${sub}` : grupo || sub;
    nomes.push(nomeUnico(nomes, combinado));
  }

  const linhas = [];
  for (let i = achado.inicioDados; i < bloco.length; i++) {
    const valores = bloco[i].valores;
    if (preenchidas(valores).length < 2) continue;
    // Linhas de total/subtotal duplicariam os valores nas somas e nos gráficos.
    const primeira = String(preenchidas(valores)[0] ?? '').trim();
    if (/^(sub)?total\b/i.test(primeira)) continue;
    const objeto = {};
    nomes.forEach((nome, c) => {
      objeto[nome] = valores[c] ?? '';
    });
    linhas.push(objeto);
  }
  if (linhas.length === 0) return null;

  // Colunas sem nenhum valor nos dados são ruído (células mescladas, margens).
  const comValor = nomes.filter((nome) => linhas.some((linha) => String(linha[nome] ?? '').trim() !== ''));
  if (comValor.length < 2) return null;

  const limpas = linhas.map((linha) => {
    const objeto = {};
    for (const nome of comValor) objeto[nome] = linha[nome];
    return objeto;
  });

  const titulo = tituloDoBloco(bloco);
  const nome = titulo ? `${nomePlanilha} · ${titulo}` : nomePlanilha;
  return analisarTabela(nome, limpas);
}

export async function extrair(buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw erroAmigavel('Não consegui abrir este arquivo .xlsx. Ele pode estar corrompido.');
  }

  const tabelas = [];
  workbook.eachSheet((planilha) => {
    for (const bloco of blocosDaPlanilha(planilha)) {
      const tabela = tabelaDoBloco(planilha.name, bloco);
      if (tabela) tabelas.push(tabela);
    }
  });

  if (tabelas.length === 0) {
    throw erroAmigavel('Esta planilha não tem linhas de dados legíveis após o cabeçalho.');
  }

  return { tipo: 'tabular', contexto: contextoDasTabelas(tabelas), tabelas };
}
