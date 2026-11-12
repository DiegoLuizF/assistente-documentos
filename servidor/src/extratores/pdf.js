import { PDFParse } from 'pdf-parse';
import { erroAmigavel } from '../erros.js';

const MINIMO_CARACTERES_TEXTO = 40;

export async function extrair(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let texto;
  try {
    const resultado = await parser.getText();
    texto = (resultado.text ?? '').trim();
  } finally {
    await parser.destroy();
  }

  if (texto.length < MINIMO_CARACTERES_TEXTO) {
    throw erroAmigavel(
      'Este PDF parece ser uma imagem; não consigo ler o texto. Se for um documento digitalizado, ele precisa passar por OCR antes.'
    );
  }

  return { tipo: 'texto', contexto: texto, tabelas: null };
}
