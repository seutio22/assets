# Modelagem de Dados (ERD)

## Diagrama Entidade-Relacionamento

```
┌─────────────┐
│   Tenant    │
├─────────────┤
│ id (PK)     │
│ name        │
│ domain      │
│ createdAt   │
│ updatedAt   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ tenantId(FK)│──┐
│ email       │  │
│ password    │  │
│ name        │  │
│ role        │  │
│ active      │  │
│ createdAt   │  │
│ updatedAt   │  │
└─────────────┘  │
                 │
       ┌─────────┘
       │
       │ N
┌──────▼──────┐
│  Cliente    │
├─────────────┤
│ id (PK)     │
│ tenantId(FK)│
│ name        │
│ cnpj        │
│ email       │
│ phone       │
│ address     │
│ city        │
│ state       │
│ zipCode     │
│ createdAt   │
│ updatedAt   │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────┐
│  Apólice    │
├─────────────┤
│ id (PK)     │
│ tenantId(FK)│
│ clienteId(FK)│
│ fornecedorId(FK)│
│ numero      │
│ tipo        │
│ vigenciaInicio│
│ vigenciaFim │
│ valor       │
│ status      │
│ createdAt   │
│ updatedAt   │
└──────┬──────┘
       │ N
       │
       │ 1
┌──────▼──────┐
│ Fornecedor  │
├─────────────┤
│ id (PK)     │
│ tenantId(FK)│
│ name        │
│ cnpj        │
│ email       │
│ phone       │
│ address     │
│ city        │
│ state       │
│ zipCode     │
│ createdAt   │
│ updatedAt   │
└─────────────┘

┌─────────────┐
│ Assinatura  │
├─────────────┤
│ id (PK)     │
│ tenantId(FK)│
│ plan        │
│ status      │
│ startDate   │
│ endDate     │
│ price       │
│ createdAt   │
│ updatedAt   │
└─────────────┘
```

## Schema Prisma

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  domain    String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users       User[]
  clientes    Cliente[]
  fornecedores Fornecedor[]
  apolices    Apolice[]
  assinatura  Assinatura?

  @@map("tenants")
}

model User {
  id        String   @id @default(uuid())
  tenantId  String
  email     String
  password  String
  name      String
  role      Role     @default(OPERADOR)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, email])
  @@map("users")
}

model Cliente {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  cnpj      String?
  email     String?
  phone     String?
  address   String?
  city      String?
  state     String?
  zipCode   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  apolices Apolice[]

  @@map("clientes")
}

model Fornecedor {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  cnpj      String?
  email     String?
  phone     String?
  address   String?
  city      String?
  state     String?
  zipCode   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  apolices Apolice[]

  @@map("fornecedores")
}

model Apolice {
  id             String    @id @default(uuid())
  tenantId       String
  clienteId      String
  fornecedorId   String
  numero         String
  tipo           String
  vigenciaInicio DateTime
  vigenciaFim    DateTime
  valor          Decimal   @db.Decimal(10, 2)
  status         String    @default("ATIVA")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  tenant     Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  cliente    Cliente    @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  fornecedor Fornecedor @relation(fields: [fornecedorId], references: [id], onDelete: Cascade)

  @@map("apolices")
}

model Assinatura {
  id        String   @id @default(uuid())
  tenantId  String   @unique
  plan      Plan
  status    String   @default("ATIVA")
  startDate DateTime
  endDate   DateTime?
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("assinaturas")
}

enum Role {
  ADMIN
  GESTOR
  OPERADOR
}

enum Plan {
  BASICO
  PREMIUM
  ENTERPRISE
}
```

## Índices

```sql
-- Índices para performance
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX idx_fornecedores_tenant ON fornecedores(tenant_id);
CREATE INDEX idx_apolices_tenant ON apolices(tenant_id);
CREATE INDEX idx_apolices_cliente ON apolices(cliente_id);
CREATE INDEX idx_apolices_fornecedor ON apolices(fornecedor_id);
```

