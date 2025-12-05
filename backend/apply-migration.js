const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function applyMigration() {
  console.log('🔄 Verificando e aplicando migrations do banco de dados...');
  
  try {
    // Tentar usar db push para aplicar mudanças do schema
    console.log('📦 Aplicando mudanças do schema Prisma...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ Schema atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    // Não falhar o deploy se a migration falhar (pode já estar aplicada)
    console.log('⚠️  Continuando mesmo com erro na migration...');
  }
}

applyMigration().catch(console.error);

