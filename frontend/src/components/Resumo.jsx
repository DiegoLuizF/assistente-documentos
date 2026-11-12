export default function Resumo({ texto }) {
  return (
    <section className="cartao">
      <h2>Resumo</h2>
      <p className="resumo-texto">{texto}</p>
    </section>
  );
}
