# Diagnóstico: Erro 502 Bad Gateway

## Problema
O backend está retornando erro 502 Bad Gateway, indicando que o servidor não está iniciando corretamente no Railway.

## Possíveis Causas

1. **Servidor não está iniciando**: O processo Node.js pode estar crashando ao iniciar
2. **Problema com Prisma Client**: O Prisma Client foi regenerado mas o banco não tem os campos novos
3. **Erro no código**: Algum erro está impedindo o servidor de iniciar

## Solução Imediata

### 1. Verificar Logs no Railway
- Acesse o dashboard do Railway
- Vá para o serviço do backend
- Verifique os logs de deploy e runtime
- Procure por erros ao iniciar

### 2. Aplicar Migration do Banco de Dados

Os campos novos (`dataNascimento` e `ativo`) precisam ser adicionados ao banco:

```sql
ALTER TABLE "contatos" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP;
ALTER TABLE "contatos" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true;
UPDATE "contatos" SET "ativo" = true WHERE "ativo" IS NULL;
```

**Como aplicar:**
1. Acesse o PostgreSQL no Railway
2. Vá para a aba "Query" ou use o Railway CLI:
   ```bash
   railway run psql $DATABASE_URL -c "ALTER TABLE contatos ADD COLUMN IF NOT EXISTS dataNascimento TIMESTAMP;"
   railway run psql $DATABASE_URL -c "ALTER TABLE contatos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;"
   ```

### 3. Verificar Variáveis de Ambiente

No Railway, verifique se estas variáveis estão configuradas:
- `DATABASE_URL` (deve apontar para o PostgreSQL)
- `JWT_SECRET`
- `PORT` (Railway define automaticamente)
- `NODE_ENV=production`

### 4. Reiniciar o Serviço

No dashboard do Railway:
- Vá para o serviço backend
- Clique em "Deployments"
- Clique em "Redeploy" no último deploy

## Status Atual

- ✅ CORS configurado corretamente
- ✅ Query de contatos usando `select` para evitar erros
- ⚠️ Migration ainda não aplicada no banco
- ⚠️ Servidor pode estar crashando ao iniciar

## Próximos Passos

1. Verificar logs no Railway
2. Aplicar migration no banco
3. Reiniciar o serviço backend

