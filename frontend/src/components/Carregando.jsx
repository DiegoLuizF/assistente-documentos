export default function Carregando({ texto }) {
  return (
    <div className="carregando" role="status">
      <span className="girando" aria-hidden="true" />
      {texto}
    </div>
  );
}
