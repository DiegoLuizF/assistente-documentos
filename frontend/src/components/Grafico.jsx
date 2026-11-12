const CORES = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4d7c0f'];

const formatador = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

function truncar(texto, maximo) {
  return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
}

function Barras({ dados }) {
  const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1);
  return (
    <svg viewBox={`0 0 460 ${dados.length * 34 + 8}`} role="img" className="grafico-svg">
      {dados.map((d, i) => {
        const largura = (Math.abs(d.valor) / maximo) * 240;
        const y = i * 34 + 6;
        return (
          <g key={i}>
            <text x="0" y={y + 14} fontSize="12" fill="currentColor">
              {truncar(d.rotulo, 14)}
            </text>
            <rect x="120" y={y} width={largura} height="18" rx="3" fill={CORES[i % CORES.length]} />
            <text x={366 + largura} y={y + 14} fontSize="12" fill="currentColor">
              {formatador.format(d.valor)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Linhas({ dados }) {
  const largura = 460;
  const altura = 220;
  const margem = 40;
  const valores = dados.map((d) => d.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const amplitude = max - min || 1;
  const passoX = (largura - margem * 2) / (dados.length - 1 || 1);

  const pontos = dados.map((d, i) => ({
    x: margem + i * passoX,
    y: altura - margem - ((d.valor - min) / amplitude) * (altura - margem * 2),
  }));
  const caminho = pontos.map((p) => `${p.x},${p.y}`).join(' ');

  // As extremidades usam ancoragem própria para o texto não sair da área do SVG.
  const ancora = (i) => (i === 0 ? 'start' : i === dados.length - 1 ? 'end' : 'middle');
  const xRotulado = (i) => Math.min(Math.max(pontos[i].x, 24), largura - 24);

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} role="img" className="grafico-svg">
      <text x="4" y={margem + 4} fontSize="11" fill="currentColor">{formatador.format(max)}</text>
      <text x="4" y={altura - margem + 4} fontSize="11" fill="currentColor">{formatador.format(min)}</text>
      <polyline points={caminho} fill="none" stroke={CORES[0]} strokeWidth="2.5" />
      {pontos.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={CORES[0]} />
          <text x={xRotulado(i)} y={p.y - 10} fontSize="11" textAnchor={ancora(i)} fill="currentColor">
            {formatador.format(dados[i].valor)}
          </text>
          <text x={xRotulado(i)} y={altura - 8} fontSize="10" textAnchor={ancora(i)} fill="currentColor">
            {truncar(dados[i].rotulo, 10)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Pizza({ dados }) {
  const total = dados.reduce((s, d) => s + Math.abs(d.valor), 0) || 1;
  const altura = Math.max(200, 24 + dados.length * 22);
  const centroY = altura / 2;
  const raio = Math.min(80, altura / 2 - 12);
  const centroX = 100;
  let angulo = -Math.PI / 2;

  const fatias = dados.map((d, i) => {
    const fracao = Math.abs(d.valor) / total;
    const arco = fracao * Math.PI * 2;
    const x1 = centroX + raio * Math.cos(angulo);
    const y1 = centroY + raio * Math.sin(angulo);
    angulo += arco;
    const x2 = centroX + raio * Math.cos(angulo);
    const y2 = centroY + raio * Math.sin(angulo);
    const grande = arco > Math.PI ? 1 : 0;
    return { path: `M ${centroX} ${centroY} L ${x1} ${y1} A ${raio} ${raio} 0 ${grande} 1 ${x2} ${y2} Z`, cor: CORES[i % CORES.length] };
  });

  return (
    <svg viewBox={`0 0 440 ${altura}`} role="img" className="grafico-svg">
      {fatias.map((f, i) => (
        <path key={i} d={f.path} fill={f.cor} />
      ))}
      {dados.map((d, i) => (
        <g key={i}>
          <rect x="210" y={14 + i * 22} width="12" height="12" rx="2" fill={CORES[i % CORES.length]} />
          <text x="228" y={24 + i * 22} fontSize="12" fill="currentColor">
            {truncar(d.rotulo, 18)} ({Math.round((Math.abs(d.valor) / total) * 100)}%)
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Grafico({ grafico }) {
  const Tipo = { barras: Barras, linhas: Linhas, pizza: Pizza }[grafico.tipo] ?? Barras;
  return (
    <figure className="grafico">
      <figcaption>{grafico.titulo}</figcaption>
      <Tipo dados={grafico.dados} />
      {grafico.explicacao && <p className="grafico-explicacao">{grafico.explicacao}</p>}
    </figure>
  );
}
