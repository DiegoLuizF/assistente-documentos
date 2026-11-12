import OpenAI from 'openai';
import { provedores } from './config.js';
import { ErroAmigavel } from './erros.js';

const ESPERAS_RETENTATIVA_MS = [1000, 2000];
// 400/401/403 e 429/404 não se repetem: 400/401/403 são erros de configuração
// ou de pedido, e 429/404 não costumam se resolver em segundos.
const CODIGOS_QUE_PASSAM_AO_PROXIMO = new Set([400, 401, 403, 429, 404]);
const CODIGOS_COM_RETENTATIVA = new Set([500, 503]);
const TEMPO_LIMITE_MS = 90_000;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function chamarProvedor(provedor, mensagens) {
  const cliente = new OpenAI({
    apiKey: provedor.apiKey,
    baseURL: provedor.baseURL,
    timeout: TEMPO_LIMITE_MS,
    maxRetries: 0,
  });

  const resposta = await cliente.chat.completions.create({
    model: provedor.model,
    temperature: 0.2,
    messages: mensagens,
  });

  const texto = resposta.choices?.[0]?.message?.content?.trim();
  if (!texto) {
    throw new Error('O modelo devolveu uma resposta vazia.');
  }
  return texto;
}

/**
 * Percorre os provedores em ordem de prioridade até um responder.
 * `transformar` valida/converte o texto bruto do modelo; se lançar erro,
 * a resposta é tratada como falha daquele provedor e passa ao próximo.
 */
export async function gerarComFallback(mensagens, transformar = (texto) => texto) {
  if (provedores.length === 0) {
    throw new ErroAmigavel(
      'Nenhum provedor de IA está configurado. Preencha pelo menos uma chave no arquivo servidor/.env e reinicie o servidor.'
    );
  }

  const falhas = [];

  for (const provedor of provedores) {
    for (let tentativa = 0; tentativa <= ESPERAS_RETENTATIVA_MS.length; tentativa++) {
      try {
        const textoBruto = await chamarProvedor(provedor, mensagens);
        return { resultado: transformar(textoBruto), provedor: provedor.nome };
      } catch (erro) {
        const status = erro?.status;
        const falhaDeRede = erro instanceof OpenAI.APIConnectionError;
        const rotulo = `Provedor "${provedor.nome}" (tentativa ${tentativa + 1})`;

        if (erro instanceof ErroAmigavel) throw erro;

        if (CODIGOS_QUE_PASSAM_AO_PROXIMO.has(status)) {
          console.error(`${rotulo}: erro ${status}. Passando ao próximo provedor.`, erro.message);
          falhas.push(`${provedor.nome}: ${status ?? 'erro'}`);
          break;
        }

        if (CODIGOS_COM_RETENTATIVA.has(status) && tentativa < ESPERAS_RETENTATIVA_MS.length) {
          const esperaMs = ESPERAS_RETENTATIVA_MS[tentativa];
          console.error(`${rotulo}: erro ${status}. Tentando novamente em ${esperaMs}ms.`, erro.message);
          await espera(esperaMs);
          continue;
        }

        console.error(
          `${rotulo}: ${falhaDeRede ? 'falha de rede/timeout' : `erro ${status ?? 'desconhecido'}`}. Passando ao próximo provedor.`,
          erro.message
        );
        falhas.push(`${provedor.nome}: ${falhaDeRede ? 'rede/timeout' : (status ?? 'erro')}`);
        break;
      }
    }
  }

  console.error('Todos os provedores falharam:', falhas.join(' | '));
  throw new ErroAmigavel(
    'Não consegui consultar os serviços de IA neste momento. Verifique sua conexão e as chaves no arquivo servidor/.env, e tente novamente em instantes.'
  );
}
