import { erroAmigavel } from '../erros.js';

export async function extrair(buffer) {
  const texto = buffer.toString('utf8').trim();

  if (texto.length < 40) {
    throw erroAmigavel('Este arquivo de texto está vazio ou é curto demais para analisar.');
  }

  return { tipo: 'texto', contexto: texto, tabelas: null };
}
