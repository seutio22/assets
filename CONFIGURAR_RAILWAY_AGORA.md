# Configuração Railway - Passo a Passo

## ✅ Você já criou o projeto no Railway

Agora vamos configurar:

## 1️⃣ CONFIGURAR BACKEND

### No Dashboard do Railway:

1. **Se ainda não conectou o repositório:**
   - Clique em "+ New" → "GitHub Repo"
   - Selecione seu repositório
   - **IMPORTANTE:** Na configuração, defina:
     - **Root Directory:** `backend`

2. **Configurar Build (Settings → Build):**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. **Variáveis de Ambiente (Settings → Variables):**
   Adicione estas variáveis:
   ```
   JWT_SECRET=atlas-jwt-secret-key-2024-production
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=3000
   ```
   ⚠️ **NÃO adicione DATABASE_URL ainda** - será preenchido automaticamente quando criar o banco

## 2️⃣ CRIAR BANCO DE DADOS POSTGRESQL

1. No mesmo projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway cria automaticamente e **preenche DATABASE_URL** nas variáveis do backend
4. ✅ Pronto! O banco está criado e conectado

## 3️⃣ EXECUTAR MIGRATIONS E SEED

### Opção A: Via Railway CLI (Recomendado)

Abra o terminal PowerShell e execute:

```powershell
# Instalar Railway CLI (se ainda não tiver)
npm i -g @railway/cli

# Login no Railway
railway login

# Navegar para a pasta backend
cd backend

# Linkar com o projeto Railway (selecione o projeto quando pedir)
railway link

# Executar migrations
railway run npx prisma migrate deploy

# Executar seed (criar usuário admin)
railway run npm run prisma:seed
```

### Opção B: Via Terminal do Railway (Dashboard)

1. No dashboard, vá em **"Deployments"**
2. Clique no deployment mais recente do backend
3. Abra **"View Logs"**
4. Use o terminal integrado para executar:
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```

## 4️⃣ VERIFICAR DEPLOY DO BACKEND

1. No dashboard do Railway, vá no serviço do backend
2. Clique em **"Settings"** → **"Generate Domain"**
3. Copie a URL (ex: `atlas-backend-production.up.railway.app`)
4. Teste acessando: `https://[SUA-URL]/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

## 5️⃣ CONFIGURAR FRONTEND

1. No mesmo projeto Railway, clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Selecione o mesmo repositório
4. **IMPORTANTE:** Na configuração, defina:
   - **Root Directory:** `frontend`

5. **Configurar Build (Settings → Build):**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s dist -l 3000`

6. **Variáveis de Ambiente (Settings → Variables):**
   Adicione:
   ```
   VITE_API_URL=https://[URL-DO-BACKEND]
   ```
   ⚠️ Substitua `[URL-DO-BACKEND]` pela URL que você copiou no passo 4

## 6️⃣ GERAR DOMÍNIO DO FRONTEND

1. No serviço do frontend, vá em **"Settings"**
2. Clique em **"Generate Domain"**
3. Copie a URL do frontend

## 7️⃣ TESTAR

1. Acesse a URL do frontend
2. Faça login com:
   - **Email:** `admin@atlas.com`
   - **Senha:** `admin123`

## ✅ PRONTO!

Se tudo funcionou, você terá:
- ✅ Backend rodando no Railway
- ✅ Banco de dados PostgreSQL configurado
- ✅ Frontend conectado ao backend
- ✅ CORS funcionando automaticamente
- ✅ Login funcionando

## 🔧 Troubleshooting

### Erro: "Cannot find module"
- Verifique se o Root Directory está como `backend` ou `frontend`

### Erro: "Database not found"
- Verifique se criou o PostgreSQL
- Verifique se DATABASE_URL está nas variáveis

### Erro: "Migrations failed"
- Execute: `railway run npx prisma migrate deploy`

### Erro: "User not found"
- Execute: `railway run npm run prisma:seed`

### Logs
- Acesse "Deployments" → "View Logs" para ver erros em tempo real

