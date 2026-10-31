const AppError = require('../errors/AppError');

function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

function tratarErros(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { naoEncontrado, tratarErros };
