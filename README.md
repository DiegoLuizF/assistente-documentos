# Assistente Inteligente de Documentos

Aplicação local que recebe um documento ou planilha e devolve: **resumo**, **informações importantes em tópicos**, **gráficos** (quando os dados permitem) e um **chat** para perguntas sobre o conteúdo — incluindo cálculos exatos sobre planilhas. O texto/estrutura do arquivo é extraído no servidor e enviado a um modelo de IA via endpoints OpenAI-compatíveis, com **fallback automático entre provedores**.

## Formatos suportados

| Formato | O que a IA recebe |
|---|---|
| PDF | Texto extraído no servidor |
| DOCX | Texto completo (mammoth) |
| XLSX | Perfil de cada aba: colunas, tipos, totais, médias e amostra de linhas |
| CSV / TSV | Perfil da tabela, como XLSX |
| TXT / MD | Texto completo |

Para planilhas, além do resumo em tópicos a IA pode gerar **gráficos** (barras, linhas ou pizza, desenhados em SVG puro no navegador) e o chat pode executar **cálculos exatos** (soma, média, mínimo, máximo, contagem, com filtro opcional) sobre as linhas completas — os números são calculados pelo servidor, não pelo modelo.

## Estrutura

```
servidor/   API Node 22 + Express (extração de documentos, fallback de provedores)
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

Copie o modelo de referência e edite:

```bash
cp servidor/.env.example servidor/.env
```

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
- O servidor não armazena nada em disco: o arquivo chega em memória, só o texto ou o perfil dos dados vai ao modelo, e o resultado da extração fica em cache volátil (por hash do arquivo) para não reprocessar a cada pergunta.
- PDFs digitalizados (só imagem, sem texto) não são lidos — a aplicação avisa isso claramente.
- Em planilhas muito grandes (mais de 500 mil células), o chat mantém o perfil estatístico mas não retém todas as linhas para cálculos exatos.
