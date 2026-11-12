export default function Topicos({ topicos }) {
  return (
    <section className="cartao">
      <h2>Informações importantes</h2>
      <ul className="lista-topicos">
        {topicos.map((topico) => (
          <li key={topico.id} className="topico">
            <h3>{topico.titulo}</h3>
            {topico.detalhe && <p>{topico.detalhe}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
