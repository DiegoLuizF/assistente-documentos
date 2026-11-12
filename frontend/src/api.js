export async function analisarDocumento(arquivo) {
  const dados = new FormData();
  dados.append('arquivo', arquivo);
  return chamada('/api/analise', dados);
}

export async function perguntar(arquivo, pergunta, historico) {
  const dados = new FormData();
  dados.append('arquivo', arquivo);
  dados.append('pergunta', pergunta);
  dados.append('historico', JSON.stringify(historico));
  return chamada('/api/pergunta', dados);
}

async function chamada(url, corpo) {
  let resposta;
  try {
    resposta = await fetch(url, { method: 'POST', body: corpo });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se ele está rodando.');
  }

  let dadosResposta = {};
  try {
    dadosResposta = await resposta.json();
  } catch {
    // resposta sem JSON: cai na mensagem genérica abaixo
  }

  if (!resposta.ok) {
    throw new Error(dadosResposta.erro ?? 'O servidor respondeu com um erro inesperado. Tente novamente.');
  }
  return dadosResposta;
}
