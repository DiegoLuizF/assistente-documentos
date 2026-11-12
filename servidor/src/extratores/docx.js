import mammoth from 'mammoth';
import { erroAmigavel } from '../erros.js';

export async function extrair(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  const texto = (value ?? '').trim();

  if (texto.length < 40) {
    throw erroAmigavel('Não consegui extrair texto deste arquivo .docx. Ele pode estar vazio ou conter só imagens.');
  }

  return { tipo: 'texto', contexto: texto, tabelas: null };
}
