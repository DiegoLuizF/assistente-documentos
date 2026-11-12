import { useState } from 'react';
import { analisarDocumento, perguntar } from './api.js';
import UploadPdf from './components/UploadPdf.jsx';
import Carregando from './components/Carregando.jsx';
import Aviso from './components/Aviso.jsx';
import Resumo from './components/Resumo.jsx';
import Topicos from './components/Topicos.jsx';
import Chat from './components/Chat.jsx';

const estadoInicial = {
  resumo: null,
  topicos: [],
  mensagens: [],
  erro: null,
  avisoTruncado: false,
};

export default function App() {
  const [arquivo, setArquivo] = useState(null);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  const [carregandoChat, setCarregandoChat] = useState(false);
  const [resultado, setResultado] = useState(estadoInicial);

  async function selecionarArquivo(novoArquivo) {
    setArquivo(novoArquivo);
    setResultado(estadoInicial);
    setCarregandoAnalise(true);
    try {
      const dados = await analisarDocumento(novoArquivo);
      setResultado({
        resumo: dados.resumo,
        topicos: dados.topicos,
        mensagens: [],
        erro: null,
        avisoTruncado: Boolean(dados.textoTruncado),
      });
    } catch (erro) {
      setResultado({ ...estadoInicial, erro: erro.message });
    } finally {
      setCarregandoAnalise(false);
    }
  }

  function trocarArquivo() {
    setArquivo(null);
    setResultado(estadoInicial);
  }

  async function enviarPergunta(pergunta) {
    const mensagensAtuais = resultado.mensagens;
    // Mensagens de erro não vão ao histórico: reforçariam o padrão de "não encontrei".
    const historico = mensagensAtuais
      .filter((m) => !m.falhou)
      .map((m) => ({
        papel: m.autor === 'voce' ? 'usuario' : 'assistente',
        conteudo: m.texto,
      }));

    setCarregandoChat(true);
    setResultado((atual) => ({
      ...atual,
      mensagens: [...mensagensAtuais, { autor: 'voce', texto: pergunta }],
    }));

    try {
      const dados = await perguntar(arquivo, pergunta, historico);
      setResultado((atual) => ({
        ...atual,
        mensagens: [
          ...atual.mensagens,
          { autor: 'assistente', texto: dados.resposta, provedor: dados.provedor },
        ],
        avisoTruncado: atual.avisoTruncado || Boolean(dados.textoTruncado),
      }));
    } catch (erro) {
      setResultado((atual) => ({
        ...atual,
        mensagens: [...atual.mensagens, { autor: 'assistente', texto: erro.message, falhou: true }],
      }));
    } finally {
      setCarregandoChat(false);
    }
  }

  return (
    <main className="pagina">
      <header className="cabecalho">
        <h1>Assistente de Documentos</h1>
        <p className="subtitulo">
          Envie um PDF e receba um resumo, os pontos importantes e respostas às suas perguntas.
        </p>
      </header>

      <UploadPdf
        aoSelecionar={selecionarArquivo}
        aoTrocar={trocarArquivo}
        carregando={carregandoAnalise}
        nomeArquivo={arquivo?.name ?? null}
      />

      {carregandoAnalise && <Carregando texto="Analisando o documento…" />}

      {resultado.erro && <Aviso tipo="erro">{resultado.erro}</Aviso>}

      {resultado.avisoTruncado && (
        <Aviso tipo="info">
          Documento muito longo: apenas parte dele foi analisada.
        </Aviso>
      )}

      {resultado.resumo && (
        <>
          <Resumo texto={resultado.resumo} />
          <Topicos topicos={resultado.topicos} />
          <Chat
            mensagens={resultado.mensagens}
            aoEnviar={enviarPergunta}
            carregando={carregandoChat}
            desabilitado={!arquivo || carregandoAnalise}
          />
        </>
      )}
    </main>
  );
}
