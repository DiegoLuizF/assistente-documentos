import { PDFParse } from 'pdf-parse';

export async function extrairTexto(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const resultado = await parser.getText();
    return resultado.text ?? '';
  } finally {
    await parser.destroy();
  }
}
