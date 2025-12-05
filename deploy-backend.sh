#!/bin/bash

# Script de Deploy do Backend - Atlas Sistema Gestão
# Execute este script após configurar as variáveis de ambiente no Vercel

echo "🚀 Preparando deploy do backend..."

# Verificar se está no diretório correto
if [ ! -f "backend/package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

cd backend

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  ATENÇÃO: DATABASE_URL não está configurada"
    echo "Configure no Vercel Dashboard → Settings → Environment Variables"
    echo ""
fi

# Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npm run prisma:generate

# Build do projeto
echo "🔨 Fazendo build..."
npm run build

echo "✅ Backend pronto para deploy!"
echo ""
echo "📝 Próximos passos:"
echo "1. Faça commit e push do código"
echo "2. No Vercel Dashboard, conecte o repositório"
echo "3. Configure Root Directory: backend"
echo "4. Configure Build Command: npm run build"
echo "5. Configure Output Directory: dist"
echo "6. Adicione as variáveis de ambiente (veja DEPLOY.md)"
echo "7. Clique em Deploy"


