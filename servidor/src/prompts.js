export function mensagensAnalise(texto) {
  return [
    {
      role: 'system',
      content:
        'Você é um assistente que analisa documentos. Responda sempre em português do Brasil, de forma clara e objetiva.',
    },
    {
      role: 'user',
      content: [
        'Analise o documento abaixo e devolva SOMENTE um JSON válido, sem nenhum texto antes ou depois e sem cercas de código, exatamente neste formato:',
        '{"resumo": "resumo do documento em um parágrafo curto", "topicos": [{"id": "topico-1", "titulo": "título curto do ponto importante", "detalhe": "explicação breve do ponto"}]}',
        'Inclua de 3 a 8 tópicos com as informações mais importantes do documento.',
        '',
        'DOCUMENTO:',
        `"""${texto}"""`,
      ].join('\n'),
    },
  ];
}

export function mensagensPergunta(texto, pergunta, historico) {
  const mensagens = [
    {
      role: 'system',
      content:
        'Você é um assistente que responde perguntas sobre um documento. Use EXCLUSIVAMENTE as informações do documento fornecido. Se a resposta não estiver no documento, responda exatamente: "Não encontrei essa informação no documento." Responda em português do Brasil, de forma direta.',
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
    content: `DOCUMENTO:\n"""\n${texto}\n"""\n\nPergunta: ${pergunta}`,
  });

  return mensagens;
}
