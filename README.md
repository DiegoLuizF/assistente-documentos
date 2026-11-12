# Assistente Inteligente de Documentos

Aplicação local que recebe um PDF e devolve: **resumo**, **informações importantes em tópicos** e um **chat** para perguntas sobre o conteúdo. O texto do PDF é extraído no servidor e enviado a um modelo de IA via endpoints OpenAI-compatíveis, com **fallback automático entre provedores**.

## Estrutura

```
servidor/   API Node 22 + Express (extração de PDF, fallback de provedores)
frontend/   React + Vite (interface em português)
```

## 1. Obter as chaves de API

Você não precisa de todas: preencha pelo menos uma.

| Provedor | Onde obter a chave | Variável |
|---|---|---|
| Google Gemini | [Google AI Studio](https://aistudio.google.com/apikey) (há camada gratuita) | `GEMINI_API_KEY` |
| Mistral AI | [La Plateforme](https://console.mistral.ai/) → API Keys | `MISTRAL_API_KEY` |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/settings/keys) (tem modelos gratuitos) | `OPENROUTER_API_KEY` |

## 2. Preencher o `.env`

Copie `servidor/.env.example` para `servidor/.env` e preencha:

- `PROVEDORES`: ordem de prioridade, separada por vírgulas. Provedores sem chave preenchida são ignorados.
- Para adicionar um provedor novo, basta acrescentar `NOME_API_KEY`, `NOME_BASE_URL` e `NOME_MODEL` e incluir `nome` na lista `PROVEDORES` — não é preciso mudar código.
- Para o OpenRouter, escolha um modelo gratuito em [openrouter.ai/models?max_price=0](https://openrouter.ai/models?max_price=0) (IDs terminam em `:free`).

## 3. Rodar

Requisitos: Node 22+ (testado em Fedora Silverblue dentro de toolbox, sem Docker).

Terminal 1 — servidor:

```bash
cd servidor
npm install
npm run dev        # ou npm start
```

Terminal 2 — interface:

```bash
cd frontend
npm install
npm run dev
```

Abra **http://localhost:5173**. Em desenvolvimento, o Vite repassa as chamadas `/api` para o servidor na porta 3000.

## Notas

- As chaves ficam só no servidor; o navegador nunca as vê.
- O servidor não armazena nada em disco: o PDF chega em memória, só o texto extraído vai ao modelo, e o texto fica em cache volátil (por hash do arquivo) para não reprocessar o mesmo PDF a cada pergunta.
- PDFs digitalizados (só imagem, sem texto) não são lidos — a aplicação avisa isso claramente.
