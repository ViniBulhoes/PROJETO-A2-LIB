const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidos.repository');

const pedidoValido = {
  cliente: 'Carlos Silva',
  tipo: 'entrega',
  valor: 350,
  prioridade: 'normal',
};

beforeEach(() => {
  repository.limpar();
});

describe('POST /pedidos', () => {
  test('cria pedido válido e retorna 201 com status recebido', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('remove espaços nas extremidades do cliente', async () => {
    const res = await request(app)
      .post('/pedidos')
      .send({ ...pedidoValido, cliente: '  Ana  ' });
    expect(res.status).toBe(201);
    expect(res.body.cliente).toBe('Ana');
  });

  test('rejeita cliente vazio ou só com espaços', async () => {
    for (const cliente of ['', '   ', undefined, 123]) {
      const res = await request(app).post('/pedidos').send({ ...pedidoValido, cliente });
      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/cliente/);
    }
  });

  test('rejeita valor zero, negativo, texto ou ausente', async () => {
    for (const valor of [0, -10, '350', null, undefined]) {
      const res = await request(app).post('/pedidos').send({ ...pedidoValido, valor });
      expect(res.status).toBe(400);
      expect(res.body.erro).toMatch(/valor/);
    }
  });

  test('rejeita tipo e prioridade desconhecidos', async () => {
    const r1 = await request(app).post('/pedidos').send({ ...pedidoValido, tipo: 'voo' });
    expect(r1.status).toBe(400);
    expect(r1.body.erro).toMatch(/tipo/);

    const r2 = await request(app).post('/pedidos').send({ ...pedidoValido, prioridade: 'urgente' });
    expect(r2.status).toBe(400);
    expect(r2.body.erro).toMatch(/prioridade/);
  });

  test('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set('Content-Type', 'application/json')
      .send('{ cliente: ');
    expect(res.status).toBe(400);
    expect(res.body.erro).toBeDefined();
  });

  test('retorna 400 quando não há corpo', async () => {
    const res = await request(app).post('/pedidos');
    expect(res.status).toBe(400);
  });
});

describe('GET /pedidos', () => {
  test('retorna lista vazia inicialmente', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('retorna os pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send({ ...pedidoValido, cliente: 'Maria' });
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((p) => p.id)).toEqual([1, 2]);
  });
});

describe('GET /pedidos/:id', () => {
  test('retorna pedido existente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
    expect(res.body.cliente).toBe('Carlos Silva');
  });

  test('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/pedidos/999');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('retorna 404 para id não numérico', async () => {
    const res = await request(app).get('/pedidos/abc');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /pedidos/:id/status', () => {
  beforeEach(async () => {
    await request(app).post('/pedidos').send(pedidoValido);
  });

  const patch = (id, body) => request(app).patch(`/pedidos/${id}/status`).send(body);

  test('atualiza status com transição válida', async () => {
    const res = await patch(1, { status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');

    const consulta = await request(app).get('/pedidos/1');
    expect(consulta.body.status).toBe('em_preparacao');
  });

  test('percorre o fluxo completo até entregue', async () => {
    for (const status of ['em_preparacao', 'enviado', 'entregue']) {
      const res = await patch(1, { status });
      expect(res.status).toBe(200);
    }
  });

  test('retorna 400 para status desconhecido', async () => {
    const res = await patch(1, { status: 'voando' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/status/);
  });

  test('retorna 400 quando status está ausente', async () => {
    const res = await patch(1, {});
    expect(res.status).toBe(400);
  });

  test('retorna 400 para transição inválida (pular etapas)', async () => {
    const res = await patch(1, { status: 'entregue' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/transição/);
  });

  test('status finais não aceitam novas transições', async () => {
    await patch(1, { status: 'cancelado' });
    const res = await patch(1, { status: 'em_preparacao' });
    expect(res.status).toBe(400);
  });

  test('retorna 404 para id inexistente', async () => {
    const res = await patch(999, { status: 'em_preparacao' });
    expect(res.status).toBe(404);
  });
});

describe('GET /', () => {
  test('retorna informações básicas da API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.rotas).toContain('GET /pedidos');
  });
});

describe('Rotas desconhecidas e erros inesperados', () => {
  test('rota inexistente retorna 404 em JSON', async () => {
    const res = await request(app).get('/qualquer');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  test('erro inesperado retorna 500 sem vazar detalhes', async () => {
    const spy = jest.spyOn(repository, 'listar').mockImplementation(() => {
      throw new Error('falha interna secreta');
    });
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/secreta/);

    spy.mockRestore();
    log.mockRestore();
  });
});
