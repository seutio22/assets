const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo histórico de migrations...\n');

const migrationsDir = path.join(__dirname, 'prisma', 'migrations');

// Remover pasta vazia add_implantacao_module
const duplicateDir = path.join(migrationsDir, 'add_implantacao_module');
if (fs.existsSync(duplicateDir)) {
  console.log('❌ Encontrada pasta vazia: add_implantacao_module');
  try {
    const files = fs.readdirSync(duplicateDir);
    if (files.length === 0) {
      fs.rmSync(duplicateDir, { recursive: true, force: true });
      console.log('✅ Pasta vazia removida!\n');
    } else {
      console.log('⚠️  Pasta contém arquivos:', files);
      console.log('   Removendo mesmo assim...');
      fs.rmSync(duplicateDir, { recursive: true, force: true });
      console.log('✅ Pasta removida!\n');
    }
  } catch (error) {
    console.error('❌ Erro ao remover:', error.message);
    console.log('\n💡 Remova manualmente: prisma/migrations/add_implantacao_module\n');
  }
} else {
  console.log('✅ Nenhuma pasta duplicada encontrada\n');
}

// Verificar se o banco tem a tabela _prisma_migrations
console.log('📋 Próximos passos:');
console.log('   1. Execute: npx prisma migrate resolve --applied add_implantacao_module');
console.log('   2. OU delete o banco e recrie: del prisma\\dev.db');
console.log('   3. Depois: npx prisma migrate dev --name add_permissions_system');
console.log('   4. E então: npm run prisma:generate');
console.log('   5. Por fim: npm run prisma:seed');

