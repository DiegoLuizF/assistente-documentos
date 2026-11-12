import Grafico from './Grafico.jsx';

export default function Graficos({ graficos }) {
  if (!graficos?.length) return null;
  return (
    <section className="cartao">
      <h2>Gráficos</h2>
      <div className="lista-graficos">
        {graficos.map((grafico) => (
          <Grafico key={grafico.id} grafico={grafico} />
        ))}
      </div>
    </section>
  );
}
