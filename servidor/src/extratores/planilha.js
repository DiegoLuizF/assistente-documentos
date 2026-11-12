import ExcelJS from 'exceljs';
import { analisarTabela, contextoDasTabelas } from '../tabelas.js';
import { erroAmigavel } from '../erros.js';

const MAX_COLUNAS = 60;

function valorDaCelula(celula) {
  if (celula === null || celula === undefined) return '';
  if (celula instanceof Date) return celula.toISOString().slice(0, 10);
  if (typeof celula === 'object') {
    if (typeof celula.text === 'string') return celula.text;
    if ('result' in celula) return valorDaCelula(celula.result);
    return '';
  }
  return celula;
}

function linhasDaPlanilha(planilha) {
  const linhas = [];
  let cabecalho = null;

  planilha.eachRow((linha) => {
    const valores = [];
    const total = Math.min(linha.cellCount, MAX_COLUNAS);
    for (let c = 1; c <= total; c++) {
      valores.push(valorDaCelula(linha.getCell(c).value));
    }
    const preenchidas = valores.filter((v) => String(v).trim() !== '');

    if (!cabecalho) {
      if (preenchidas.length < 2) return;
      cabecalho = valores.map((v, i) => (String(v).trim() === '' ? `Coluna ${i + 1}` : String(v).trim()));
      return;
    }
    if (preenchidas.length === 0) return;

    const objeto = {};
    cabecalho.forEach((nome, i) => {
      objeto[nome] = valores[i] ?? '';
    });
    linhas.push(objeto);
  });

  return { cabecalho, linhas };
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
    const { cabecalho, linhas } = linhasDaPlanilha(planilha);
    if (!cabecalho || linhas.length === 0) return;
    tabelas.push(analisarTabela(planilha.name, linhas));
  });

  if (tabelas.length === 0) {
    throw erroAmigavel('Esta planilha não tem linhas de dados legíveis após o cabeçalho.');
  }

  return { tipo: 'tabular', contexto: contextoDasTabelas(tabelas), tabelas };
}
