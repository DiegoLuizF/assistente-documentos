import { createHash } from 'node:crypto';
import { MAX_CHARS_TEXTO } from './config.js';
import { erroAmigavel } from './erros.js';

const MINIMO_CARACTERES_TEXTO = 40;

export function hashDoArquivo(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function prepararTexto(textoBruto) {
  const texto = textoBruto.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();

  if (texto.length < MINIMO_CARACTERES_TEXTO) {
    throw erroAmigavel(
      'Este PDF parece ser uma imagem; não consigo ler o texto. Se for um documento digitalizado, ele precisa passar por OCR antes.'
    );
  }

  return {
    texto: texto.slice(0, MAX_CHARS_TEXTO),
    truncado: texto.length > MAX_CHARS_TEXTO,
  };
}
