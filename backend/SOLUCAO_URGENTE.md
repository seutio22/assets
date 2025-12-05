# ⚠️ SOLUÇÃO URGENTE: Backend Não Está Respondendo

## Status Atual
- ❌ Backend retornando **502 Bad Gateway**
- ❌ Erros de **CORS** (consequência do 502)
- ❌ Servidor crashando com **SIGSEGV** após iniciar

## Causa Raiz
O servidor está crashando porque os campos `dataNascimento` e `ativo` foram adicionados ao schema do Prisma, mas **AINDA NÃO EXISTEM** no banco de dados PostgreSQL do Railway.

## Solução Imediata

### Passo 1: Aplicar Migration no Banco de Dados

Você precisa executar este SQL no PostgreSQL do Railway:

```sql
ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP;

ALTER TABLE "contatos" 
ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true;

UPDATE "contatos" 
SET "ativo" = true 
WHERE "ativo" IS NULL;
```

### Passo 2: Como Aplicar no Railway

**Opção A: Via Railway Dashboard (Recomendado)**

1. Acesse: https://railway.app
2. Entre no seu projeto
3. Clique no serviço **PostgreSQL**
4. Vá na aba **"Query"** ou **"Connect"**
5. Execute o SQL acima
6. Clique em **"Run"** ou **"Execute"**

**Opção B: Via Railway CLI**

```bash
# 1. Conectar ao PostgreSQL
railway run psql $DATABASE_URL

# 2. Depois execute as queries SQL acima
ALTER TABLE "contatos" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP;
ALTER TABLE "contatos" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true;
UPDATE "contatos" SET "ativo" = true WHERE "ativo" IS NULL;
```

### Passo 3: Reiniciar o Backend

Após aplicar a migration:

1. Vá para o serviço **backend** no Railway
2. Clique em **"Redeploy"** ou aguarde o auto-redeploy
3. Verifique os logs para confirmar que está rodando

## Verificação

Após aplicar a migration, verifique:

1. **Health Check:**
   ```
   https://amusing-flexibility-production.up.railway.app/api/v1/health
   ```
   Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Logs do Railway:**
   - Acesse os logs do serviço backend
   - Deve mostrar: `🚀 Server running on port 3000`
   - **NÃO** deve mostrar erros SIGSEGV

## O Que Já Foi Feito

✅ Configuração de CORS simplificada  
✅ Queries de contatos usando `select` para evitar campos ausentes  
✅ Tratamento de erros robusto no servidor  
✅ Script SQL criado: `backend/prisma/migrations/apply_contato_fields.sql`

## Próximo Passo Crítico

**APLICAR A MIGRATION NO BANCO DE DADOS POSTGRESQL DO RAILWAY**

Sem isso, o backend continuará crashando e não responderá às requisições.

