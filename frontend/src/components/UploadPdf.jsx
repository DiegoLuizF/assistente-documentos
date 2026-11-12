import { useRef } from 'react';

export default function UploadPdf({ aoSelecionar, aoTrocar, carregando, nomeArquivo }) {
  const entradaRef = useRef(null);

  function aoMudar(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (arquivo) aoSelecionar(arquivo);
  }

  return (
    <section className="cartao upload">
      <input
        ref={entradaRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={aoMudar}
        disabled={carregando}
        className="entrada-arquivo"
        aria-label="Selecionar arquivo PDF"
      />
      <button
        type="button"
        className="botao botao-primario"
        onClick={() => entradaRef.current?.click()}
        disabled={carregando}
      >
        {nomeArquivo ? 'Enviar outro PDF' : 'Escolher PDF'}
      </button>
      {nomeArquivo && (
        <p className="nome-arquivo">
          <span className="rotulo-arquivo">Arquivo:</span> {nomeArquivo}
          <button type="button" className="botao-trocar" onClick={aoTrocar} disabled={carregando}>
            remover
          </button>
        </p>
      )}
      <p className="dica">Até 15 MB. O arquivo não é armazenado: só o texto é enviado ao modelo de IA.</p>
    </section>
  );
}
