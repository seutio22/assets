const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    console.log('🔍 Verificando sistema de permissões...\n');
    
    // Tentar desbloquear banco primeiro
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      if (e.message.includes('locked')) {
        console.log('⚠️  Banco está bloqueado. Aguarde alguns segundos e tente novamente.');
        console.log('   Ou execute: npm run unlock:db');
        await prisma.$disconnect();
        process.exit(1);
      }
    }
    
    // Verificar se as tabelas existem
    const tables = ['roles', 'permissions', 'resources', 'role_permissions', 'user_roles'];
    const missing = [];
    
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ Tabela ${table} existe`);
      } catch (e) {
        if (e.message.includes('no such table') || e.message.includes('does not exist')) {
          console.log(`❌ Tabela ${table} NÃO existe`);
          missing.push(table);
        } else if (e.message.includes('locked')) {
          console.log(`⚠️  Banco bloqueado ao verificar ${table}`);
          console.log('   Aguarde alguns segundos e execute novamente.');
          await prisma.$disconnect();
          process.exit(1);
        } else {
          throw e;
        }
      }
    }
    
    if (missing.length > 0) {
      console.log('\n⚠️  Sistema de permissões não inicializado!');
      console.log('\n📋 Para inicializar, execute:');
      console.log('   npm run prisma:migrate dev --name add_permissions_system');
      console.log('   npm run prisma:seed');
      process.exit(1);
    } else {
      console.log('\n✅ Todas as tabelas de permissões existem!');
      
      // Verificar se há dados
      const rolesCount = await prisma.role.count();
      const permissionsCount = await prisma.permission.count();
      const resourcesCount = await prisma.resource.count();
      
      console.log(`\n📊 Estatísticas:`);
      console.log(`   - Perfis: ${rolesCount}`);
      console.log(`   - Permissões: ${permissionsCount}`);
      console.log(`   - Recursos: ${resourcesCount}`);
      
      if (rolesCount === 0 || permissionsCount === 0 || resourcesCount === 0) {
        console.log('\n⚠️  Tabelas vazias! Execute o seed:');
        console.log('   npm run prisma:seed');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();

