const nomesPedidos = (process.env.PROVEDORES ?? '')
  .split(',')
  .map((nome) => nome.trim())
  .filter(Boolean);

export const MAX_CHARS_TEXTO = Number(process.env.MAX_CHARS_TEXTO) || 300000;
export const PORTA = Number(process.env.PORTA) || 3000;
export const TAMANHO_MAX_PDF = 15 * 1024 * 1024;

// Provedores sem chave preenchida são ignorados silenciosamente.
export const provedores = nomesPedidos
  .map((nome) => ({
    nome,
    apiKey: process.env[`${nome.toUpperCase()}_API_KEY`],
    baseURL: process.env[`${nome.toUpperCase()}_BASE_URL`],
    model: process.env[`${nome.toUpperCase()}_MODEL`],
  }))
  .filter((p) => p.apiKey && p.baseURL && p.model);
