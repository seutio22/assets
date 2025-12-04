const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando banco de dados...\n');
    
    // Verificar se as tabelas básicas existem
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Tabela users existe');
    
    // Verificar se as tabelas de permissões existem
    try {
      const resources = await prisma.resource.findMany({ take: 1 });
      console.log('✅ Tabela resources existe');
    } catch (e) {
      console.log('❌ Tabela resources NÃO existe - Migration não executada!');
      console.log('   Execute: npm run prisma:migrate dev --name add_permissions_system');
    }
    
    try {
      const roles = await prisma.role.findMany({ take: 1 });
      console.log('✅ Tabela roles existe');
    } catch (e) {
      console.log('❌ Tabela roles NÃO existe - Migration não executada!');
    }
    
    try {
      const permissions = await prisma.permission.findMany({ take: 1 });
      console.log('✅ Tabela permissions existe');
    } catch (e) {
      console.log('❌ Tabela permissions NÃO existe - Migration não executada!');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
    console.error('\nDetalhes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

