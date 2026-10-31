const express = require('express');
const pedidosRoutes = require('./routes/pedidos.routes');
const { naoEncontrado, tratarErros } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    nome: 'API de Gerenciamento de Pedidos',
    status: 'online',
    rotas: [
      'POST /pedidos',
      'GET /pedidos',
      'GET /pedidos/:id',
      'PATCH /pedidos/:id/status',
    ],
  });
});

app.use('/pedidos', pedidosRoutes);
app.use(naoEncontrado);
app.use(tratarErros);

module.exports = app;
