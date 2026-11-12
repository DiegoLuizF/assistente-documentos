const CORES = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#4d7c0f'];

function Barras({ dados }) {
  const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1);
  return (
    <svg viewBox={`0 0 420 ${dados.length * 34 + 8}`} role="img" className="grafico-svg">
      {dados.map((d, i) => {
        const largura = (Math.abs(d.valor) / maximo) * 280;
        const y = i * 34 + 6;
        return (
          <g key={i}>
            <text x="0" y={y + 14} fontSize="12" fill="currentColor" className="rotulo">
              {d.rotulo.length > 16 ? `${d.rotulo.slice(0, 15)}…` : d.rotulo}
            </text>
            <rect x="110" y={y} width={largura} height="18" rx="3" fill={CORES[i % CORES.length]} />
            <text x={114 + largura} y={y + 14} fontSize="12" fill="currentColor">
              {d.valor}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Linhas({ dados }) {
  const largura = 420;
  const altura = 200;
  const margem = 30;
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

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} role="img" className="grafico-svg">
      <text x={margem - 24} y={margem + 4} fontSize="11" fill="currentColor">{max}</text>
      <text x={margem - 24} y={altura - margem + 4} fontSize="11" fill="currentColor">{min}</text>
      <polyline points={caminho} fill="none" stroke={CORES[0]} strokeWidth="2.5" />
      {pontos.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={CORES[0]} />
          <text x={p.x} y={p.y - 10} fontSize="11" textAnchor="middle" fill="currentColor">
            {dados[i].valor}
          </text>
          <text x={p.x} y={altura - 8} fontSize="10" textAnchor="middle" fill="currentColor" className="rotulo">
            {dados[i].rotulo.length > 10 ? `${dados[i].rotulo.slice(0, 9)}…` : dados[i].rotulo}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Pizza({ dados }) {
  const total = dados.reduce((s, d) => s + Math.abs(d.valor), 0) || 1;
  const centro = 100;
  const raio = 80;
  let angulo = -Math.PI / 2;

  const fatias = dados.map((d, i) => {
    const fração = Math.abs(d.valor) / total;
    const arco = fração * Math.PI * 2;
    const x1 = centro + raio * Math.cos(angulo);
    const y1 = centro + raio * Math.sin(angulo);
    angulo += arco;
    const x2 = centro + raio * Math.cos(angulo);
    const y2 = centro + raio * Math.sin(angulo);
    const grande = arco > Math.PI ? 1 : 0;
    return { path: `M ${centro} ${centro} L ${x1} ${y1} A ${raio} ${raio} 0 ${grande} 1 ${x2} ${y2} Z`, cor: CORES[i % CORES.length], d };
  });

  return (
    <svg viewBox="0 0 420 200" role="img" className="grafico-svg">
      {fatias.map((f, i) => (
        <path key={i} d={f.path} fill={f.cor} />
      ))}
      {dados.map((d, i) => (
        <g key={i}>
          <rect x="215" y={14 + i * 22} width="12" height="12" rx="2" fill={CORES[i % CORES.length]} />
          <text x="233" y={24 + i * 22} fontSize="12" fill="currentColor">
            {d.rotulo} ({Math.round((Math.abs(d.valor) / total) * 100)}%)
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
    </figure>
  );
}
