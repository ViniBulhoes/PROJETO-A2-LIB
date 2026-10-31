const service = require('../services/pedidos.service');

function lerId(req) {
  const id = req.params.id;
  return /^\d+$/.test(id) ? Number(id) : NaN;
}

function criar(req, res, next) {
  try {
    const pedido = service.criarPedido(req.body);
    res.status(201).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(service.listarPedidos());
  } catch (erro) {
    next(erro);
  }
}

function buscarPorId(req, res, next) {
  try {
    const pedido = service.buscarPedido(lerId(req));
    res.status(200).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

function atualizarStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    const pedido = service.atualizarStatus(lerId(req), status);
    res.status(200).json(pedido);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listar, buscarPorId, atualizarStatus };
