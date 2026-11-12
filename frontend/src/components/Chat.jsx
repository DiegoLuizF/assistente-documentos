import { useState } from 'react';
import FonteProvedor from './FonteProvedor.jsx';
import Carregando from './Carregando.jsx';

export default function Chat({ mensagens, aoEnviar, carregando, desabilitado }) {
  const [pergunta, setPergunta] = useState('');

  function enviar(evento) {
    evento.preventDefault();
    const texto = pergunta.trim();
    if (!texto || carregando) return;
    setPergunta('');
    aoEnviar(texto);
  }

  return (
    <section className="cartao chat">
      <h2>Pergunte sobre o documento</h2>

      <div className="mensagens">
        {mensagens.length === 0 && (
          <p className="chat-vazio">Faça uma pergunta sobre o conteúdo do documento.</p>
        )}
        {mensagens.map((mensagem, indice) => (
          <div key={indice} className={`mensagem mensagem-${mensagem.autor}`}>
            <p className={mensagem.falhou ? 'texto-erro' : undefined}>{mensagem.texto}</p>
            {mensagem.autor === 'assistente' && !mensagem.falhou && (
              <FonteProvedor provedor={mensagem.provedor} />
            )}
          </div>
        ))}
        {carregando && (
          <div className="mensagem mensagem-assistente" role="status">
            <Carregando texto="Pensando…" />
          </div>
        )}
      </div>

      <form className="formulario-chat" onSubmit={enviar}>
        <input
          type="text"
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          placeholder="Ex.: Qual é o prazo mencionado no documento?"
          disabled={desabilitado || carregando}
          aria-label="Sua pergunta"
        />
        <button type="submit" className="botao botao-primario" disabled={desabilitado || carregando || !pergunta.trim()}>
          Enviar
        </button>
      </form>
    </section>
  );
}
