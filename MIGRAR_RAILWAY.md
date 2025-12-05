# Migração para Railway - Solução Definitiva para CORS

## Por que Railway?

- ✅ **Sem problemas de CORS**: Railway não intercepta OPTIONS como o Vercel
- ✅ **Deploy simples**: Conecta Git e funciona
- ✅ **Banco de dados incluído**: PostgreSQL gerenciado
- ✅ **SSL automático**: HTTPS gratuito
- ✅ **Logs em tempo real**: Fácil debug
- ✅ **Custo baixo**: ~$15/mês para tudo

## Passo 1: Criar Conta Railway

1. Acesse: https://railway.app
2. Faça login com GitHub
3. Crie novo projeto

## Passo 2: Deploy do Backend

### 2.1. Conectar Repositório
1. No Railway, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha o repositório
4. Selecione a pasta `backend`

### 2.2. Configurar Build
Railway detecta automaticamente Node.js, mas configure:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
```
backend
```

### 2.3. Variáveis de Ambiente
No Railway, adicione:

```
DATABASE_URL=<será preenchido automaticamente quando criar o banco>
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
```

## Passo 3: Criar Banco de Dados PostgreSQL

1. No projeto Railway, clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Railway cria automaticamente e preenche `DATABASE_URL`
4. Copie a `DATABASE_URL` para as variáveis do backend

## Passo 4: Executar Migrações e Seed

### 4.1. Via Railway CLI (Recomendado)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Linkar projeto
railway link

# Executar migrations
railway run npx prisma migrate deploy

# Executar seed
railway run npm run prisma:seed
```

### 4.2. Via Terminal do Railway
1. No dashboard, vá em "Deployments"
2. Clique no deployment mais recente
3. Abra "View Logs"
4. Use o terminal integrado para executar comandos

## Passo 5: Deploy do Frontend

### 5.1. Criar Novo Serviço
1. No mesmo projeto Railway, clique em "+ New"
2. Selecione "GitHub Repo"
3. Escolha a pasta `frontend`

### 5.2. Configurar Build
**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npx serve -s dist -l 3000
```

**Root Directory:**
```
frontend
```

### 5.3. Variáveis de Ambiente
Adicione:

```
VITE_API_URL=https://seu-backend.railway.app
```

**IMPORTANTE:** Substitua `seu-backend.railway.app` pela URL real do backend (aparece no dashboard do Railway)

## Passo 6: Configurar Domínios

### 6.1. Backend
1. No serviço do backend, vá em "Settings"
2. Clique em "Generate Domain"
3. Copie a URL (ex: `atlas-backend-production.up.railway.app`)

### 6.2. Frontend
1. No serviço do frontend, vá em "Settings"
2. Clique em "Generate Domain"
3. Copie a URL (ex: `atlas-frontend-production.up.railway.app`)

### 6.3. Atualizar Frontend
Atualize a variável de ambiente do frontend:

```
VITE_API_URL=https://atlas-backend-production.up.railway.app
```

Redeploy o frontend para aplicar.

## Passo 7: Atualizar CORS no Backend

O backend já está configurado com CORS permitindo `*`, então funcionará automaticamente no Railway.

## Passo 8: Testar

1. Acesse a URL do frontend
2. Faça login com:
   - Email: `admin@atlas.com`
   - Senha: `admin123`

## Troubleshooting

### Erro: "Database not found"
- Verifique se o banco foi criado
- Verifique se `DATABASE_URL` está configurada

### Erro: "Migrations not applied"
```bash
railway run npx prisma migrate deploy
```

### Erro: "User not found"
```bash
railway run npm run prisma:seed
```

### Logs
- Acesse "Deployments" → "View Logs" no Railway
- Logs em tempo real

## Custos

- **Hobby Plan**: $5/mês por serviço
- **Backend**: $5/mês
- **Frontend**: $5/mês  
- **PostgreSQL**: $5/mês
- **Total**: ~$15/mês

## Vantagens sobre Vercel

✅ CORS funciona sem configuração extra
✅ Banco de dados integrado
✅ Logs mais fáceis de debugar
✅ Deploy mais simples
✅ Sem problemas de serverless functions

## Próximos Passos

1. Testar login
2. Verificar todas as funcionalidades
3. Configurar domínio customizado (opcional)
4. Configurar backups automáticos

