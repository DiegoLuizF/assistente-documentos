import { Router } from 'express';
import multer from 'multer';
import { TAMANHO_MAX_PDF } from '../config.js';
import { gerarComFallback } from '../ia.js';
import { hashDoArquivo, prepararContexto } from '../texto.js';
import { obterDoCache, guardarNoCache } from '../cache.js';
import { mensagensAnalise, mensagensPergunta, mensagensComResultados } from '../prompts.js';
import { transformarAnalise, interpretarRespostaChat } from '../json.js';
import { executarCalculos } from '../calculo.js';
import { extrairContexto, FORMATOS_ACEITOS, MIMES_ACEITOS } from '../extratores/index.js';
import { erroAmigavel, ErroAmigavel } from '../erros.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAX_PDF },
});

function validarArquivo(req) {
  const arquivo = req.file;
  if (!arquivo) {
    throw erroAmigavel('Envie um documento para analisar.');
  }
  if (arquivo.mimetype !== 'application/octet-stream' && !MIMES_ACEITOS.has(arquivo.mimetype)) {
    throw erroAmigavel(`Tipo de arquivo não suportado. Formatos aceitos: ${FORMATOS_ACEITOS.join(', ')}.`);
  }
  return arquivo;
}

// Extração com cache: evita reprocessar o mesmo arquivo a cada pergunta do chat.
async function obterContexto(nomeArquivo, buffer) {
  const chave = hashDoArquivo(buffer);
  const emCache = obterDoCache(chave);
  if (emCache) return emCache;

  const extraido = await extrairContexto(nomeArquivo, buffer);
  const preparado = prepararContexto(extraido.contexto);
  const resultado = {
    tipo: extraido.tipo,
    contexto: preparado.contexto,
    truncado: preparado.truncado,
    tabelas: extraido.tabelas,
  };
  guardarNoCache(chave, resultado);
  return resultado;
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

router.post('/analise', upload.single('arquivo'), async (req, res, next) => {
  try {
    const arquivo = validarArquivo(req);
    const { tipo, contexto, truncado } = await obterContexto(arquivo.originalname, arquivo.buffer);

    const { resultado, provedor } = await gerarComFallback(mensagensAnalise(contexto, tipo), transformarAnalise);

    res.json({ tipo, ...resultado, provedor, textoTruncado: truncado });
  } catch (erro) {
    next(erro);
  }
});

router.post('/pergunta', upload.single('arquivo'), async (req, res, next) => {
  try {
    const arquivo = validarArquivo(req);
    const pergunta = (req.body.pergunta ?? '').trim();
    if (!pergunta) {
      throw erroAmigavel('Escreva uma pergunta antes de enviar.');
    }

    const { tipo, contexto, truncado, tabelas } = await obterContexto(arquivo.originalname, arquivo.buffer);
    const historico = lerHistorico(req);
    const mensagens = mensagensPergunta(contexto, pergunta, historico, tipo);

    const primeira = await gerarComFallback(mensagens);

    // Para dados tabulares, a primeira resposta pode ser um pedido de cálculo
    // (o servidor calcula sobre as linhas completas) ou um pedido de gráfico
    // (validado e devolvido com a resposta); texto puro segue direto.
    const interpretacao = tipo === 'tabular' && tabelas ? interpretarRespostaChat(primeira.resultado) : null;

    if (!interpretacao || interpretacao.tipo === 'texto') {
      const resposta = interpretacao?.resposta ?? primeira.resultado;
      res.json({ resposta, provedor: primeira.provedor, textoTruncado: truncado });
      return;
    }

    if (interpretacao.tipo === 'graficos') {
      res.json({
        resposta: interpretacao.resposta,
        graficos: interpretacao.graficos,
        provedor: primeira.provedor,
        textoTruncado: truncado,
      });
      return;
    }

    const resultados = executarCalculos(tabelas, interpretacao.pedidos);
    const segunda = await gerarComFallback(mensagensComResultados(mensagens, primeira.resultado, resultados));

    // A resposta final pode aproveitar para vir acompanhada de gráficos.
    const interpretacao2 = interpretarRespostaChat(segunda.resultado);
    if (interpretacao2?.tipo === 'texto') {
      res.json({ resposta: interpretacao2.resposta, provedor: segunda.provedor, textoTruncado: truncado });
      return;
    }
    if (interpretacao2?.tipo === 'graficos') {
      res.json({
        resposta: interpretacao2.resposta,
        graficos: interpretacao2.graficos,
        provedor: segunda.provedor,
        textoTruncado: truncado,
      });
      return;
    }

    res.json({ resposta: segunda.resultado, provedor: segunda.provedor, textoTruncado: truncado });
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
        ? 'O arquivo é maior que 15 MB. Envie um arquivo menor.'
        : 'Não foi possível receber o arquivo. Tente novamente.';
    res.status(400).json({ erro: mensagem });
    return;
  }
  console.error('Erro inesperado na requisição:', erro);
  res.status(500).json({ erro: 'Ocorreu um erro inesperado no servidor. Tente novamente.' });
}
