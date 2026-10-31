# API de Gerenciamento de Pedidos

API REST para gerenciamento de pedidos de uma pequena loja, desenvolvida para a disciplina **Tópicos Avançados em Sistemas de Informação II**.

- **Aluno:** _<Vinicius Bulhões Porto>_
- **RGM:** _<43638457>_

## Tecnologias

- Node.js + Express (JavaScript)
- Armazenamento em memória (os dados são perdidos ao reiniciar a aplicação)
- Jest + Supertest (testes automatizados)
- Postman (testes manuais)

## Instalação e execução

Requer Node.js 18 ou superior.

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000` (use a variável de ambiente `PORT` para mudar a porta).

## Testes automatizados

```bash
npm test
```

Os testes cobrem criação, validações, listagem, consulta, atualização de status, transições inválidas, rotas desconhecidas e erro inesperado (500).

## Valores aceitos

| Campo | Regra |
|---|---|
| `cliente` | texto não vazio (espaços nas extremidades são removidos) |
| `valor` | número (tipo `number` do JSON) maior que zero. Texto como `"350"` é rejeitado |
| `tipo` | `entrega` ou `retirada` |
| `prioridade` | `baixa`, `normal` ou `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

Todo pedido novo é criado com status `recebido`.

### Transições de status permitidas

```
recebido ──► em_preparacao ──► enviado ──► entregue
    │              │
    └──────────────┴──► cancelado
```

| Status atual | Pode ir para |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue` | _(final)_ |
| `cancelado` | _(final)_ |

Uma transição fora dessa tabela retorna **400** com mensagem explicando o que é permitido.

## Rotas

Além das rotas abaixo, `GET /` retorna uma página inicial em JSON com o nome da API e a lista de rotas.

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 | 400 |
| GET | `/pedidos` | 200 | |
| GET | `/pedidos/:id` | 200 | 404 |
| PATCH | `/pedidos/:id/status` | 200 | 400, 404 |

Erros são sempre JSON no formato `{ "erro": "mensagem" }`. Rotas inexistentes retornam 404 e erros inesperados retornam 500 com mensagem genérica (o detalhe fica só no log do servidor).

Na rota PATCH, o 404 (pedido inexistente) tem precedência sobre o 400 (corpo inválido).

### Exemplos

**Criar pedido**

```http
POST /pedidos
Content-Type: application/json

{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```

Resposta `201`:

```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

**Pedido inválido** (`valor` igual a 0) — resposta `400`:

```json
{ "erro": "valor deve ser um número maior que zero" }
```

**Atualizar status**

```http
PATCH /pedidos/1/status
Content-Type: application/json

{ "status": "em_preparacao" }
```

Resposta `200`: o pedido completo com o novo status.

**Transição inválida** (`recebido` → `entregue`) — resposta `400`:

```json
{ "erro": "transição inválida de \"recebido\" para \"entregue\"; transições permitidas: em_preparacao, cancelado" }
```

## Arquitetura

Arquitetura em camadas. Cada camada só conhece a camada imediatamente abaixo:

```
src/
├── server.js                  # inicia o servidor (porta)
├── app.js                     # configura o Express, rotas e middlewares
├── routes/
│   └── pedidos.routes.js      # mapeia método + URL para o controller
├── controllers/
│   └── pedidos.controller.js  # camada HTTP: lê req, chama o service, escolhe o status da resposta
├── services/
│   └── pedidos.service.js     # regras de negócio: validações e transições de status
├── repositories/
│   └── pedidos.repository.js  # acesso aos dados (array em memória)
├── middlewares/
│   └── errorHandler.js        # 404 de rota e tratamento central de erros
└── errors/
    └── AppError.js            # erro com código HTTP para falhas esperadas
tests/
└── pedidos.test.js
```

**Fluxo de uma requisição:** `routes` → `controller` → `service` → `repository`.

**Decisões:**

- **Services concentram as regras.** Validação e máquina de estados ficam no service, sem depender de `req`/`res`, para poderem ser testadas e trocadas de interface sem reescrita.
- **Repository separado.** Isola o armazenamento em memória; trocar por um banco de dados exigiria alterar só esse arquivo.
- **`AppError` vs. erro inesperado.** Falhas esperadas (validação, não encontrado) lançam `AppError` com código HTTP. Qualquer outro erro cai no `errorHandler` como **500**, sem expor detalhes internos ao cliente, para não ser confundido com erro de validação.
- **Transição inválida = 400.** O corpo enviado é um dado inválido para o estado atual do pedido.
- **Id não numérico = 404.** Nenhum pedido pode ter esse identificador.

## Evidências

A pasta [`evidencias/`](./evidencias) contém as capturas do Postman:

| Arquivo | Cenário |
|---|---|
| `01-criacao.png` | POST válido, 201 |
| `02-validacao.png` | POST inválido, 400 |
| `03-listagem.png` | GET da lista |
| `04-consulta-inexistente.png` | GET de id inexistente, 404 |
| `05-atualizacao.png` | PATCH de status válido, 200 |

## Uso de IA

Utilizei o Claude (Anthropic) como apoio neste projeto, nas seguintes tarefas:

- propor a organização do projeto em camadas (routes, controllers, services e repository);
- gerar uma versão de referência do código e dos testes com Jest/Supertest, além de um rascunho deste README;
- sugerir os valores aceitos para `tipo`, `prioridade` e as transições do `status`.
- ajuda com as mensagens de commit e a manter a ordem certa na hora de subir para o github no final do projeto

A partir dessa versão de referência, eu reescrevi o código e os testes no meu computador, li cada arquivo, rodei `npm test`, testei as rotas no Postman e revisei o README antes de entregar. Reconheço que a estrutura e a lógica têm origem na sugestão da IA e que sou responsável por entender, explicar e corrigir tudo o que está no repositório.

**Sugestão aceita:** separar o acesso aos dados em uma camada `repository`. Aceitei porque o service deixa de depender de como os pedidos são guardados, e trocar a memória por um banco exigiria mexer só nesse arquivo.

**Sugestão modificada:** a primeira versão do código veio com muitos comentários e trechos mais elaborados do que o necessário. Pedi para remover os comentários e simplificar o código, mantendo o mesmo comportamento, e rodei os testes de novo para confirmar que nada mudou.
