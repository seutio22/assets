# Diagnóstico: Erro SIGSEGV (Segmentation Fault)

## Problema
O servidor inicia corretamente ("Server running on port 3000") mas depois cai com erro SIGSEGV, que é um crash fatal do processo Node.js.

## Causa Provável
O SIGSEGV geralmente indica que o Prisma Client está tentando acessar campos que não existem no banco de dados, causando um acesso inválido à memória.

## Campos que Precisam Ser Adicionados
Os campos `dataNascimento` e `ativo` foram adicionados ao schema do Prisma mas ainda não existem no banco de dados PostgreSQL.

## Solução

### 1. Aplicar Migration no Banco de Dados

Execute estas queries SQL no PostgreSQL do Railway:

```sql
-- Adicionar coluna dataNascimento se não existir
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP;

-- Adicionar coluna ativo se não existir
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true;

-- Atualizar registros existentes
UPDATE "contatos" 
SET "ativo" = true 
WHERE "ativo" IS NULL;
```

### 2. Como Aplicar no Railway

**Opção A: Via Railway Dashboard**
1. Acesse o Railway Dashboard
2. Vá para o serviço PostgreSQL
3. Abra a aba "Query" ou "Connect"
4. Execute as queries SQL acima

**Opção B: Via Railway CLI**
```bash
# Conectar ao PostgreSQL
railway run psql $DATABASE_URL

# Depois execute as queries SQL
```

### 3. Reiniciar o Serviço Backend

Após aplicar as migrations:
1. Vá para o serviço backend no Railway
2. Clique em "Redeploy" ou aguarde o auto-redeploy
3. Verifique os logs para confirmar que o servidor está rodando

## Status Atual

- ✅ CORS configurado corretamente
- ✅ Query de contatos usando `select` para evitar erros
- ✅ Tratamento de erros adicionado ao servidor
- ⚠️ Migration ainda não aplicada no banco (CAUSA DO CRASH)

## Próximos Passos

1. **Aplicar a migration SQL** no banco de dados PostgreSQL
2. **Reiniciar o serviço backend** no Railway
3. **Verificar os logs** para confirmar que o servidor está rodando sem erros

