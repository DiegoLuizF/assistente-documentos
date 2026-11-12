import { createHash } from 'node:crypto';
import { MAX_CHARS_TEXTO } from './config.js';

export function hashDoArquivo(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function prepararContexto(contextoBruto) {
  const contexto = contextoBruto.replace(/\r/g, '').trim();
  return {
    contexto: contexto.slice(0, MAX_CHARS_TEXTO),
    truncado: contexto.length > MAX_CHARS_TEXTO,
  };
}
