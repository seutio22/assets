const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo migrations...\n');

const migrationsDir = path.join(__dirname, 'prisma', 'migrations');

// Verificar se existe a pasta duplicada
const duplicateDir = path.join(migrationsDir, 'add_implantacao_module');
if (fs.existsSync(duplicateDir)) {
  console.log('❌ Encontrada migration duplicada: add_implantacao_module');
  console.log('   Removendo...');
  
  try {
    fs.rmSync(duplicateDir, { recursive: true, force: true });
    console.log('✅ Migration duplicada removida!\n');
  } catch (error) {
    console.error('❌ Erro ao remover:', error.message);
    console.log('\n💡 Remova manualmente a pasta: prisma/migrations/add_implantacao_module\n');
  }
} else {
  console.log('✅ Nenhuma migration duplicada encontrada\n');
}

console.log('📋 Próximos passos:');
console.log('   1. npm run prisma:generate');
console.log('   2. npm run prisma:migrate dev --name add_permissions_system');
console.log('   3. npm run prisma:seed');

