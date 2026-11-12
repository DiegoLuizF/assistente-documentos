export function mensagensAnalise(contexto, tipo) {
  const regrasGraficos =
    tipo === 'tabular'
      ? [
          'Se os dados permitirem, inclua também de 0 a 3 gráficos, cada um assim:',
          '{"tipo": "barras" | "linhas" | "pizza", "titulo": "título curto", "explicacao": "uma frase dizendo o que o gráfico mostra e por que importa", "dados": [{"rotulo": "rótulo curto", "valor": 123}]}',
          'Use apenas números coerentes com o perfil e a amostra (somas, médias, contagens). Quando existirem somas por categoria no perfil, use esses valores exatos. Máximo de 12 pontos por gráfico. Se nenhum gráfico fizer sentido, use [].',
        ]
      : [];

  return [
    {
      role: 'system',
      content:
        'Você é um assistente que analisa documentos e planilhas. Responda sempre em português do Brasil, de forma clara e objetiva.',
    },
    {
      role: 'user',
      content: [
        'Analise o conteúdo abaixo e devolva SOMENTE um JSON válido, sem nenhum texto antes ou depois e sem cercas de código, exatamente neste formato:',
        '{"resumo": "resumo em um parágrafo curto", "topicos": [{"id": "topico-1", "titulo": "título curto do ponto importante", "detalhe": "explicação breve do ponto"}]}',
        'Inclua de 3 a 8 tópicos com as informações mais importantes.',
        'Escreva todo valor numérico no padrão brasileiro: ponto como separador de milhar e vírgula como decimal (ex.: 1.234.567,89). Se o valor for monetário, use o prefixo R$.',
        ...regrasGraficos,
        '',
        'CONTEÚDO:',
        `"""${contexto}"""`,
      ].join('\n'),
    },
  ];
}

const BASE_PERGUNTA =
  'Você responde perguntas sobre um documento. Use somente as informações do conteúdo fornecido na última mensagem do usuário. A resposta costuma estar no conteúdo: procure com atenção antes de concluir que não há. Apenas se a informação realmente não estiver no conteúdo, responda exatamente: "Não encontrei essa informação no documento." Responda em português do Brasil, de forma direta. Escreva todo valor numérico no padrão brasileiro (ex.: R$ 1.234.567,89).';

const REGRA_TABULAR =
  ' Os dados tabulares aparecem como perfil estatístico e amostra — a lista completa de linhas não está no prompt. Você tem dois recursos especiais, um por resposta:' +
  ' (1) sempre que a pergunta pedir um total, soma, média, mínimo, máximo ou contagem — inclusive filtrado por um valor (ex.: "estoque do emissor X", "quantas séries vencem em 2030") — NÃO estime nem diga que não encontrou: responda SOMENTE com um JSON válido, sem texto ao redor, neste formato: {"calcular": [{"operacao": "soma" | "media" | "minimo" | "maximo" | "contar", "coluna": "nome exato da coluna", "aba": "nome da aba (opcional)", "filtro": {"coluna": "coluna", "valor": "valor"} }]} ;' +
  ' (2) se o usuário pedir um gráfico (ou algo que um gráfico responderia melhor), responda SOMENTE com um JSON válido, sem texto ao redor, neste formato: {"responder": "texto curto apresentando o gráfico", "graficos": [{"tipo": "barras" | "linhas" | "pizza", "titulo": "título curto", "explicacao": "uma frase explicando o que o gráfico mostra", "dados": [{"rotulo": "rótulo curto", "valor": 123}]}]} — use as somas por categoria do perfil quando existirem (valores exatos); se o agrupamento necessário não estiver no perfil, use primeiro o recurso (1) com um pedido para cada categoria e espere os resultados, no máximo 12 pontos por gráfico.' +
  ' Para perguntas normais, responda apenas em texto.';

export function mensagensPergunta(contexto, pergunta, historico, tipo) {
  const mensagens = [
    {
      role: 'system',
      content: BASE_PERGUNTA + (tipo === 'tabular' ? REGRA_TABULAR : ''),
    },
  ];

  for (const item of historico) {
    mensagens.push({
      role: item.papel === 'assistente' ? 'assistant' : 'user',
      content: item.conteudo,
    });
  }

  mensagens.push({
    role: 'user',
    content: `CONTEÚDO:\n"""\n${contexto}\n"""\n\nPergunta: ${pergunta}`,
  });

  return mensagens;
}

export function mensagensComResultados(mensagens, respostaDoModelo, resultados) {
  return [
    ...mensagens,
    { role: 'assistant', content: respostaDoModelo },
    {
      role: 'user',
      content: `RESULTADOS DOS CÁLCULOS (calculados sobre os dados completos):\n${resultados
        .map((r) => `- ${r}`)
        .join('\n')}\n\nAgora responda à pergunta original em português do Brasil, citando os números exatos quando relevante. Se o usuário tiver pedido um gráfico, responda SOMENTE com o JSON de gráficos do formato combinado, usando esses valores exatos; caso contrário, responda em texto.`,
    },
  ];
}
