const fs = require('fs');
const path = require('path');

console.log('🔓 Desbloqueando banco de dados...\n');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const journalPath = path.join(__dirname, 'prisma', 'dev.db-journal');
const walPath = path.join(__dirname, 'prisma', 'dev.db-wal');
const shmPath = path.join(__dirname, 'prisma', 'dev.db-shm');

// Remover arquivos de journal/WAL que podem estar bloqueando
const filesToRemove = [journalPath, walPath, shmPath];
let removed = 0;

filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      // Tentar múltiplas vezes
      let attempts = 0;
      while (attempts < 5) {
        try {
          fs.unlinkSync(file);
          console.log(`✅ Removido: ${path.basename(file)}`);
          removed++;
          break;
        } catch (e) {
          attempts++;
          if (attempts < 5) {
            // Aguardar um pouco e tentar novamente
            const start = Date.now();
            while (Date.now() - start < 100) {} // Aguardar 100ms
          } else {
            console.log(`⚠️  Não foi possível remover ${path.basename(file)} após 5 tentativas`);
          }
        }
      }
    } catch (e) {
      console.log(`⚠️  Erro ao remover ${path.basename(file)}: ${e.message}`);
    }
  }
});

if (removed === 0 && filesToRemove.every(f => !fs.existsSync(f))) {
  console.log('✅ Nenhum arquivo de lock encontrado');
}

// Verificar processos que podem estar usando o banco
console.log('\n📋 Verificando processos...');
console.log('   Certifique-se de que:');
console.log('   - Prisma Studio está fechado');
console.log('   - Servidor backend está parado (Ctrl+C)');
console.log('   - Nenhum outro processo está usando o banco');

// Tentar fechar conexões do Prisma
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Tentar desconectar com timeout
  Promise.race([
    prisma.$disconnect(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
  ]).then(() => {
    console.log('✅ Conexões Prisma fechadas');
  }).catch(() => {
    console.log('⚠️  Timeout ao fechar Prisma (pode estar já desconectado)');
  });
} catch (e) {
  console.log('⚠️  Prisma Client não disponível');
}

console.log('\n✅ Processo de desbloqueio concluído!');
console.log('\n📋 Próximos passos:');
console.log('   1. Aguarde 5 segundos');
console.log('   2. Execute: npx prisma migrate dev --name add_permissions_system');
console.log('\n💡 Se ainda der erro "database is locked":');
console.log('   - Feche TODOS os processos que podem estar usando o banco');
console.log('   - Ou delete o banco e recrie: Remove-Item prisma\\dev.db');

