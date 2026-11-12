import { Router } from 'express';
import multer from 'multer';
import { TAMANHO_MAX_PDF } from '../config.js';
import { gerarComFallback } from '../ia.js';
import { extrairTexto } from '../pdf.js';
import { hashDoArquivo, prepararTexto } from '../texto.js';
import { obterDoCache, guardarNoCache } from '../cache.js';
import { mensagensAnalise, mensagensPergunta } from '../prompts.js';
import { transformarAnalise } from '../json.js';
import { erroAmigavel, ErroAmigavel } from '../erros.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAX_PDF },
  fileFilter: (req, arquivo, cb) => {
    if (arquivo.mimetype !== 'application/pdf') {
      cb(erroAmigavel('Envie um arquivo PDF válido.'));
      return;
    }
    cb(null, true);
  },
});

function recibirPdf(req) {
  const arquivo = req.file;
  if (!arquivo) {
    throw erroAmigavel('Envie um arquivo PDF.');
  }
  const assinatura = arquivo.buffer.subarray(0, 5).toString('latin1');
  if (assinatura !== '%PDF-') {
    throw erroAmigavel('O arquivo enviado não é um PDF válido.');
  }
  return arquivo.buffer;
}

// Extração com cache: evita reprocessar o mesmo PDF a cada pergunta do chat.
async function obterTexto(buffer) {
  const chave = hashDoArquivo(buffer);
  const emCache = obterDoCache(chave);
  if (emCache) return emCache;

  const textoBruto = await extrairTexto(buffer);
  const preparado = prepararTexto(textoBruto);
  guardarNoCache(chave, preparado);
  return preparado;
}

function lerHistorico(req) {
  try {
    const bruto = JSON.parse(req.body.historico ?? '[]');
    if (!Array.isArray(bruto)) return [];
    return bruto
      .filter(
        (item) =>
          item &&
          typeof item.conteudo === 'string' &&
          item.conteudo.trim() &&
          (item.papel === 'usuario' || item.papel === 'assistente')
      )
      .slice(-10)
      .map((item) => ({ papel: item.papel, conteudo: item.conteudo.trim() }));
  } catch {
    return [];
  }
}

export const router = Router();

router.post('/analise', upload.single('pdf'), async (req, res, next) => {
  try {
    const buffer = recibirPdf(req);
    const { texto, truncado } = await obterTexto(buffer);

    const { resultado, provedor } = await gerarComFallback(mensagensAnalise(texto), transformarAnalise);

    res.json({ ...resultado, provedor, textoTruncado: truncado });
  } catch (erro) {
    next(erro);
  }
});

router.post('/pergunta', upload.single('pdf'), async (req, res, next) => {
  try {
    const buffer = recibirPdf(req);
    const pergunta = (req.body.pergunta ?? '').trim();
    if (!pergunta) {
      throw erroAmigavel('Escreva uma pergunta antes de enviar.');
    }

    const { texto, truncado } = await obterTexto(buffer);
    const historico = lerHistorico(req);

    const { resultado, provedor } = await gerarComFallback(mensagensPergunta(texto, pergunta, historico));

    res.json({ resposta: resultado, provedor, textoTruncado: truncado });
  } catch (erro) {
    next(erro);
  }
});

export function tratarErros(erro, req, res, next) {
  if (erro instanceof ErroAmigavel) {
    res.status(400).json({ erro: erro.message });
    return;
  }
  if (erro instanceof multer.MulterError) {
    const mensagem =
      erro.code === 'LIMIT_FILE_SIZE'
        ? 'O PDF é maior que 15 MB. Envie um arquivo menor.'
        : 'Não foi possível receber o arquivo. Tente novamente.';
    res.status(400).json({ erro: mensagem });
    return;
  }
  console.error('Erro inesperado na requisição:', erro);
  res.status(500).json({ erro: 'Ocorreu um erro inesperado no servidor. Tente novamente.' });
}
