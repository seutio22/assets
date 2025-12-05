# Arquitetura do Sistema

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │ Dashboard│  │ Clientes │  │Apólices  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Fornecedor│  │ Usuários │  │Assinatura│  │  Config  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │   JWT    │  │   RBAC   │  │  Tenant  │           │  │
│  │  │  Auth    │  │  Check   │  │ Isolation│           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controller Layer                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Cliente  │  │Fornecedor│  │ Apólice  │           │  │
│  │  │Controller│  │Controller│  │Controller│           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Usuário  │  │Assinatura│  │  Tenant  │           │  │
│  │  │Controller│  │Controller│  │Controller│           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Service Layer                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Business │  │  Email   │  │  Billing │           │  │
│  │  │  Logic   │  │  Service │  │  Service │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Tenant  │  │  User    │  │ Cliente  │  │Fornecedor│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Apólice  │  │Assinatura│  │  Role    │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação

```
1. Usuário faz login → POST /auth/login
2. Backend valida credenciais
3. Backend gera JWT com payload: { userId, tenantId, role }
4. Frontend armazena token no localStorage
5. Frontend inclui token em todas as requisições: Authorization: Bearer <token>
6. Middleware valida token e extrai tenantId
7. Todas as queries incluem filtro WHERE tenantId = <tenantId>
```

## Multi-Tenancy

### Estratégia: Row-Level Security (RLS)

Cada tabela possui uma coluna `tenantId` que identifica o tenant proprietário dos dados.

**Vantagens:**
- Simples de implementar
- Fácil de manter
- Bom desempenho com índices adequados

**Isolamento:**
- Todas as queries incluem `WHERE tenantId = :tenantId`
- Middleware extrai `tenantId` do JWT
- Validação em todas as operações CRUD

## Controle de Acesso (RBAC)

### Papéis (Roles)

1. **admin**: Acesso total ao tenant
   - Gerenciar usuários
   - Configurações do tenant
   - Assinaturas

2. **gestor**: Acesso gerencial
   - CRUD completo em Clientes, Fornecedores, Apólices
   - Visualizar relatórios
   - Não pode gerenciar usuários

3. **operador**: Acesso operacional
   - Visualizar e editar registros
   - Não pode excluir
   - Não pode acessar configurações

## Segurança

### Camadas de Proteção

1. **Autenticação**: JWT com expiração
2. **Autorização**: Middleware RBAC
3. **Validação**: Joi/Zod para validação de inputs
4. **Sanitização**: Proteção contra XSS
5. **Rate Limiting**: Proteção contra brute force
6. **HTTPS**: Comunicação criptografada
7. **CORS**: Configuração restritiva

## Escalabilidade

### Estratégias

1. **Horizontal Scaling**: Múltiplas instâncias do backend
2. **Database Connection Pooling**: Gerenciamento eficiente de conexões
3. **Caching**: Redis para sessões e dados frequentes
4. **CDN**: Assets estáticos via CDN
5. **Load Balancer**: Distribuição de carga

