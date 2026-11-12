import * as pdf from './pdf.js';
import * as docx from './docx.js';
import * as planilha from './planilha.js';
import * as csv from './csv.js';
import * as texto from './texto.js';
import { erroAmigavel } from '../erros.js';

const EXTRATORES = {
  '.pdf': { extrator: pdf, magicos: ['%PDF-'] },
  '.docx': { extrator: docx, magicos: ['PK'] },
  '.xlsx': { extrator: planilha, magicos: ['PK'] },
  '.csv': { extrator: csv, magicos: null },
  '.tsv': { extrator: csv, magicos: null },
  '.txt': { extrator: texto, magicos: null },
  '.md': { extrator: texto, magicos: null },
};

export const FORMATOS_ACEITOS = Object.keys(EXTRATORES);

export const MIMES_ACEITOS = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/tab-separated-values',
  'text/plain',
  'text/markdown',
  'application/octet-stream',
]);

export function extensaoDe(nomeArquivo) {
  const ponto = nomeArquivo.lastIndexOf('.');
  return ponto === -1 ? '' : nomeArquivo.slice(ponto).toLowerCase();
}

export async function extrairContexto(nomeArquivo, buffer) {
  const formato = EXTRATORES[extensaoDe(nomeArquivo)];
  if (!formato) {
    throw erroAmigavel(
      `Formato não suportado. Aceito: ${FORMATOS_ACEITOS.join(', ')}.`
    );
  }

  if (formato.magicos) {
    const assinatura = buffer.subarray(0, 5).toString('latin1');
    const valido = formato.magicos.some((m) => assinatura.startsWith(m));
    if (!valido) {
      throw erroAmigavel('O arquivo enviado não parece ser do formato indicado pela extensão.');
    }
  }

  return formato.extrator.extrair(buffer);
}
