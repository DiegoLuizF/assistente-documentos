import { useRef } from 'react';

const FORMATOS = '.pdf,.docx,.xlsx,.csv,.tsv,.txt,.md';

export default function UploadArquivo({ aoSelecionar, aoTrocar, carregando, nomeArquivo }) {
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
        accept={FORMATOS}
        onChange={aoMudar}
        disabled={carregando}
        className="entrada-arquivo"
        aria-label="Selecionar documento"
      />
      <button
        type="button"
        className="botao botao-primario"
        onClick={() => entradaRef.current?.click()}
        disabled={carregando}
      >
        {nomeArquivo ? 'Enviar outro arquivo' : 'Escolher documento'}
      </button>
      {nomeArquivo && (
        <p className="nome-arquivo">
          <span className="rotulo-arquivo">Arquivo:</span> {nomeArquivo}
          <button type="button" className="botao-trocar" onClick={aoTrocar} disabled={carregando}>
            remover
          </button>
        </p>
      )}
      <p className="dica">
        PDF, DOCX, XLSX, CSV, TXT ou MD, até 15 MB. O arquivo não é armazenado: só o texto ou a estrutura dos dados é
        enviado ao modelo de IA.
      </p>
    </section>
  );
}
