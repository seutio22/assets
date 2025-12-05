# Endpoints da API

Base URL: `https://api.edge2.com/v1`

## Autenticação

### POST /auth/login
Autentica um usuário e retorna JWT.

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "usuario@exemplo.com",
    "role": "GESTOR",
    "tenantId": "uuid"
  }
}
```

### POST /auth/register
Registra um novo tenant e usuário admin.

**Request:**
```json
{
  "tenantName": "Empresa XYZ",
  "email": "admin@exemplo.com",
  "password": "senha123",
  "name": "Admin Principal"
}
```

### POST /auth/refresh
Renova o token JWT.

**Headers:**
```
Authorization: Bearer <token>
```

---

## Clientes

### GET /clientes
Lista todos os clientes do tenant.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `page`: número da página (default: 1)
- `limit`: itens por página (default: 10)
- `search`: busca por nome/CNPJ

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cliente ABC",
      "cnpj": "12.345.678/0001-90",
      "email": "contato@cliente.com",
      "phone": "(11) 98765-4321",
      "address": "Rua Exemplo, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### GET /clientes/:id
Obtém um cliente específico.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Cliente ABC",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@cliente.com",
  "phone": "(11) 98765-4321",
  "address": "Rua Exemplo, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### POST /clientes
Cria um novo cliente.

**Request:**
```json
{
  "name": "Cliente ABC",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@cliente.com",
  "phone": "(11) 98765-4321",
  "address": "Rua Exemplo, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Cliente ABC",
  ...
}
```

### PUT /clientes/:id
Atualiza um cliente.

**Request:**
```json
{
  "name": "Cliente ABC Atualizado",
  "email": "novo@cliente.com"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Cliente ABC Atualizado",
  ...
}
```

### DELETE /clientes/:id
Remove um cliente.

**Response (204):** No Content

---

## Fornecedores

### GET /fornecedores
Lista todos os fornecedores do tenant.

### GET /fornecedores/:id
Obtém um fornecedor específico.

### POST /fornecedores
Cria um novo fornecedor.

**Request:**
```json
{
  "name": "Fornecedor XYZ",
  "cnpj": "98.765.432/0001-10",
  "email": "contato@fornecedor.com",
  "phone": "(11) 91234-5678",
  "address": "Av. Fornecedor, 456",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567"
}
```

### PUT /fornecedores/:id
Atualiza um fornecedor.

### DELETE /fornecedores/:id
Remove um fornecedor.

---

## Apólices

### GET /apolices
Lista todas as apólices do tenant.

**Query Params:**
- `clienteId`: filtrar por cliente
- `fornecedorId`: filtrar por fornecedor
- `status`: filtrar por status (ATIVA, CANCELADA, VENCIDA)
- `page`, `limit`, `search`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": "AP-2024-001",
      "tipo": "Seguro Vida",
      "vigenciaInicio": "2024-01-01T00:00:00Z",
      "vigenciaFim": "2024-12-31T23:59:59Z",
      "valor": 5000.00,
      "status": "ATIVA",
      "cliente": {
        "id": "uuid",
        "name": "Cliente ABC"
      },
      "fornecedor": {
        "id": "uuid",
        "name": "Fornecedor XYZ"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### GET /apolices/:id
Obtém uma apólice específica.

### POST /apolices
Cria uma nova apólice.

**Request:**
```json
{
  "clienteId": "uuid",
  "fornecedorId": "uuid",
  "numero": "AP-2024-001",
  "tipo": "Seguro Vida",
  "vigenciaInicio": "2024-01-01",
  "vigenciaFim": "2024-12-31",
  "valor": 5000.00,
  "status": "ATIVA"
}
```

### PUT /apolices/:id
Atualiza uma apólice.

### DELETE /apolices/:id
Remove uma apólice.

---

## Usuários

### GET /usuarios
Lista todos os usuários do tenant. (Apenas ADMIN)

### GET /usuarios/:id
Obtém um usuário específico.

### POST /usuarios
Cria um novo usuário. (Apenas ADMIN)

**Request:**
```json
{
  "email": "novo@exemplo.com",
  "password": "senha123",
  "name": "Novo Usuário",
  "role": "OPERADOR"
}
```

### PUT /usuarios/:id
Atualiza um usuário.

### DELETE /usuarios/:id
Remove um usuário. (Apenas ADMIN)

---

## Assinaturas

### GET /assinaturas
Obtém a assinatura do tenant.

### POST /assinaturas
Cria/atualiza assinatura. (Apenas ADMIN)

**Request:**
```json
{
  "plan": "PREMIUM",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "price": 999.00
}
```

---

## Códigos de Status

- `200`: Sucesso
- `201`: Criado com sucesso
- `204`: Sucesso sem conteúdo
- `400`: Requisição inválida
- `401`: Não autenticado
- `403`: Não autorizado
- `404`: Não encontrado
- `500`: Erro interno do servidor

## Tratamento de Erros

**Response (400):**
```json
{
  "error": "Validation Error",
  "message": "Campos obrigatórios faltando",
  "details": [
    {
      "field": "email",
      "message": "Email é obrigatório"
    }
  ]
}
```

