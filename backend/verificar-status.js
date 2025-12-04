const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando status do sistema...\n');

// Verificar se banco existe
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const dbExists = fs.existsSync(dbPath);
console.log(`1. Banco de dados: ${dbExists ? '✅ Existe' : '❌ Não existe'}`);

// Verificar se pasta problemática foi removida
const duplicateDir = path.join(__dirname, 'prisma', 'migrations', 'add_implantacao_module');
const duplicateExists = fs.existsSync(duplicateDir);
console.log(`2. Pasta problemática: ${duplicateExists ? '❌ Ainda existe' : '✅ Removida'}`);

// Verificar migrations
const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
let migrationsCount = 0;
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => {
    const fullPath = path.join(migrationsDir, f);
    return fs.statSync(fullPath).isDirectory() && f !== 'add_implantacao_module';
  });
  migrationsCount = migrations.length;
  console.log(`3. Migrations encontradas: ${migrationsCount}`);
  migrations.forEach(m => console.log(`   - ${m}`));
}

// Verificar se node_modules/@prisma/client existe (Prisma Client gerado)
const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
const prismaClientExists = fs.existsSync(prismaClientPath);
console.log(`4. Prisma Client: ${prismaClientExists ? '✅ Gerado' : '❌ Não gerado'}`);

// Tentar verificar se as tabelas de permissões existem (se Prisma Client existe)
let tablesCheck = '⚠️  Não verificado';
if (prismaClientExists && dbExists) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Verificar se consegue acessar as tabelas
    prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('resources', 'permissions', 'roles')`
      .then(tables => {
        const tableNames = tables.map(t => t.name);
        const hasResources = tableNames.includes('resources');
        const hasPermissions = tableNames.includes('permissions');
        const hasRoles = tableNames.includes('roles');
        
        console.log(`\n5. Tabelas de permissões:`);
        console.log(`   - resources: ${hasResources ? '✅' : '❌'}`);
        console.log(`   - permissions: ${hasPermissions ? '✅' : '❌'}`);
        console.log(`   - roles: ${hasRoles ? '✅' : '❌'}`);
        
        console.log('\n========================================');
        if (hasResources && hasPermissions && hasRoles) {
          console.log('✅ Sistema de permissões está configurado!');
        } else {
          console.log('⚠️  Tabelas de permissões não encontradas');
          console.log('Execute: npx prisma migrate dev');
        }
        console.log('========================================');
        
        prisma.$disconnect();
      })
      .catch(() => {
        console.log(`\n5. Tabelas: ⚠️  Não foi possível verificar`);
        console.log('\n========================================');
        console.log('⚠️  Execute: npm run check:permissions');
        console.log('========================================');
      });
  } catch (e) {
    console.log(`\n5. Tabelas: ⚠️  Erro ao verificar - ${e.message}`);
    console.log('\n========================================');
    if (!prismaClientExists) {
      console.log('⚠️  Prisma Client não gerado');
      console.log('Execute: npm run prisma:generate');
    } else {
      console.log('⚠️  Execute: npm run check:permissions');
    }
    console.log('========================================');
  }
} else {
  console.log(`\n5. Tabelas: ⚠️  Não verificado (Prisma Client ou banco não encontrado)`);
  console.log('\n========================================');
  if (!prismaClientExists) {
    console.log('⚠️  Prisma Client não gerado');
    console.log('Execute: npm run prisma:generate');
  }
  if (!dbExists) {
    console.log('⚠️  Banco de dados não encontrado');
    console.log('Execute: npx prisma migrate dev');
  }
  console.log('========================================');
}

