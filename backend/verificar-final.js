const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando sistema de permissões...\n');
    
    // Verificar tabelas
    const tables = ['resources', 'permissions', 'roles', 'role_permissions', 'user_roles'];
    const missing = [];
    
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ Tabela ${table} existe`);
      } catch (e) {
        if (e.message.includes('no such table') || e.message.includes('does not exist')) {
          console.log(`❌ Tabela ${table} NÃO existe`);
          missing.push(table);
        } else {
          throw e;
        }
      }
    }
    
    if (missing.length > 0) {
      console.log('\n⚠️  Algumas tabelas não existem!');
      process.exit(1);
    }
    
    // Verificar dados
    const rolesCount = await prisma.role.count();
    const permissionsCount = await prisma.permission.count();
    const resourcesCount = await prisma.resource.count();
    
    console.log('\n📊 Estatísticas:');
    console.log(`   - Recursos: ${resourcesCount}`);
    console.log(`   - Permissões: ${permissionsCount}`);
    console.log(`   - Perfis: ${rolesCount}`);
    
    if (resourcesCount === 0 || permissionsCount === 0 || rolesCount === 0) {
      console.log('\n⚠️  Tabelas vazias! Execute o seed:');
      console.log('   npm run prisma:seed');
      process.exit(1);
    }
    
    console.log('\n✅ Sistema de permissões está configurado e populado!');
    console.log('\n🎉 Tudo pronto! Você pode usar o sistema de permissões agora.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('locked')) {
      console.log('\n💡 Banco bloqueado. Aguarde alguns segundos e tente novamente.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();

