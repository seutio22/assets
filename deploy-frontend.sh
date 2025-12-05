#!/bin/bash

# Script de Deploy do Frontend - Atlas Sistema Gestão

echo "🚀 Preparando deploy do frontend..."

# Verificar se está no diretório correto
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

cd frontend

# Verificar se VITE_API_URL está configurada
if [ -z "$VITE_API_URL" ]; then
    echo "⚠️  ATENÇÃO: VITE_API_URL não está configurada"
    echo "Configure no Vercel Dashboard → Settings → Environment Variables"
    echo "Exemplo: VITE_API_URL=https://seu-backend.vercel.app/api/v1"
    echo ""
fi

# Build do projeto
echo "🔨 Fazendo build..."
npm run build

echo "✅ Frontend pronto para deploy!"
echo ""
echo "📝 Próximos passos:"
echo "1. Faça commit e push do código"
echo "2. No Vercel Dashboard, conecte o repositório"
echo "3. Configure Root Directory: frontend"
echo "4. Framework: Vite"
echo "5. Adicione VITE_API_URL com a URL do backend"
echo "6. Clique em Deploy"


