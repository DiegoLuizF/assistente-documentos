import express from 'express';
import { PORTA, provedores } from './config.js';
import { router, tratarErros } from './rotas/documentos.js';

const app = express();

app.use(express.json());
app.use('/api', router);
app.use(tratarErros);

app.listen(PORTA, () => {
  const ativos = provedores.map((p) => p.nome).join(', ') || 'nenhum (preencha o servidor/.env)';
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
  console.log(`Provedores de IA ativos, em ordem de prioridade: ${ativos}`);
});
