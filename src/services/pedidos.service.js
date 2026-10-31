const AppError = require('../errors/AppError');
const repository = require('../repositories/pedidos.repository');

const TIPOS = ['entrega', 'retirada'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];

const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

function validarPedido(dados) {
  const { cliente, tipo, valor, prioridade } = dados || {};
  const erros = [];

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    erros.push('cliente é obrigatório e deve ser um texto não vazio');
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    erros.push('valor deve ser um número maior que zero');
  }
  if (!TIPOS.includes(tipo)) {
    erros.push(`tipo inválido; valores aceitos: ${TIPOS.join(', ')}`);
  }
  if (!PRIORIDADES.includes(prioridade)) {
    erros.push(`prioridade inválida; valores aceitos: ${PRIORIDADES.join(', ')}`);
  }

  if (erros.length > 0) {
    throw new AppError(erros.join('; '), 400);
  }
}

function criarPedido(dados) {
  validarPedido(dados);

  return repository.criar({
    cliente: dados.cliente.trim(),
    tipo: dados.tipo,
    valor: dados.valor,
    prioridade: dados.prioridade,
    status: 'recebido',
  });
}

function listarPedidos() {
  return repository.listar();
}

function buscarPedido(id) {
  const pedido = repository.buscarPorId(id);
  if (!pedido) {
    throw new AppError('Pedido não encontrado', 404);
  }
  return pedido;
}

function atualizarStatus(id, novoStatus) {
  const pedido = buscarPedido(id);

  if (typeof novoStatus !== 'string' || !(novoStatus in TRANSICOES)) {
    const aceitos = Object.keys(TRANSICOES).join(', ');
    throw new AppError(`status inválido; valores aceitos: ${aceitos}`, 400);
  }

  const permitidos = TRANSICOES[pedido.status];
  if (!permitidos.includes(novoStatus)) {
    const detalhe = permitidos.length > 0
      ? `transições permitidas: ${permitidos.join(', ')}`
      : 'este status é final e não aceita novas transições';
    throw new AppError(
      `transição inválida de "${pedido.status}" para "${novoStatus}"; ${detalhe}`,
      400
    );
  }

  pedido.status = novoStatus;
  return pedido;
}

module.exports = {
  criarPedido,
  listarPedidos,
  buscarPedido,
  atualizarStatus,
};
