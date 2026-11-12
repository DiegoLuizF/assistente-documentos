export default function FonteProvedor({ provedor }) {
  if (!provedor) return null;
  return <span className="fonte-provedor">respondido por {provedor}</span>;
}
