let pedidos = [];
let proximoId = 1;

function criar(dados) {
  const pedido = { id: proximoId, ...dados };
  proximoId += 1;
  pedidos.push(pedido);
  return pedido;
}

function listar() {
  return pedidos;
}

function buscarPorId(id) {
  return pedidos.find((pedido) => pedido.id === id);
}

function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, limpar };
