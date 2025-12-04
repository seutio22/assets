#!/bin/sh
set -e

echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo "📦 Criando schema no banco de dados..."
npx prisma db push --accept-data-loss

echo "🌱 Executando seed..."
npm run db:seed || echo "⚠️ Seed falhou ou já foi executado"

echo "✅ Banco de dados configurado!"

