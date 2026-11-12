export function mensagensAnalise(contexto, tipo) {
  const regrasGraficos =
    tipo === 'tabular'
      ? [
          'Se os dados permitirem, inclua também de 0 a 3 gráficos, cada um assim:',
          '{"tipo": "barras" | "linhas" | "pizza", "titulo": "título curto", "dados": [{"rotulo": "rótulo curto", "valor": 123}]}',
          'Use apenas números coerentes com o perfil e a amostra (somas, médias, contagens). Máximo de 12 pontos por gráfico. Se nenhum gráfico fizer sentido, use [].',
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
        ...regrasGraficos,
        '',
        'CONTEÚDO:',
        `"""${contexto}"""`,
      ].join('\n'),
    },
  ];
}

const BASE_PERGUNTA =
  'Você responde perguntas sobre um documento. Use somente as informações do conteúdo fornecido na última mensagem do usuário. A resposta costuma estar no conteúdo: procure com atenção antes de concluir que não há. Apenas se a informação realmente não estiver no conteúdo, responda exatamente: "Não encontrei essa informação no documento." Responda em português do Brasil, de forma direta.';

const REGRA_CALCULO =
  ' Os dados tabulares aparecem como perfil estatístico e amostra — a lista completa de linhas não está no prompt. Se a pergunta exigir um cálculo exato que o perfil não responde (soma, média, mínimo, máximo ou contagem, com ou sem filtro), responda SOMENTE com um JSON válido, sem texto ao redor, neste formato: {"calcular": [{"operacao": "soma" | "media" | "minimo" | "maximo" | "contar", "coluna": "nome exato da coluna", "aba": "nome da aba (opcional)", "filtro": {"coluna": "coluna", "valor": "valor"} }]} . Para perguntas normais, responda apenas em texto.';

export function mensagensPergunta(contexto, pergunta, historico, tipo) {
  const mensagens = [
    {
      role: 'system',
      content: BASE_PERGUNTA + (tipo === 'tabular' ? REGRA_CALCULO : ''),
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
        .join('\n')}\n\nAgora responda à pergunta original em texto, em português do Brasil, citando os números quando relevante.`,
    },
  ];
}
