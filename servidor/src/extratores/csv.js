import { parse } from 'csv-parse/sync';
import { analisarTabela, contextoDasTabelas } from '../tabelas.js';
import { erroAmigavel } from '../erros.js';

export async function extrair(buffer) {
  const texto = buffer.toString('utf8');

  let linhas;
  try {
    linhas = parse(texto, {
      columns: true,
      skip_empty_lines: true,
      delimiter: 'auto',
      cast: true,
      bom: true,
    });
  } catch {
    throw erroAmigavel('Não consegui interpretar este arquivo CSV. Verifique se o separador e o conteúdo estão corretos.');
  }

  if (!Array.isArray(linhas) || linhas.length === 0) {
    throw erroAmigavel('Este arquivo CSV não tem linhas de dados legíveis.');
  }

  const tabela = analisarTabela('CSV', linhas);
  return { tipo: 'tabular', contexto: contextoDasTabelas([tabela]), tabelas: [tabela] };
}
