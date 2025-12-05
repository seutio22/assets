const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigrationSQL() {
  console.log('🔄 Aplicando migration SQL para campos de contatos...');
  
  try {
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'apply_contato_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar cada comando SQL separadamente
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`✅ Executado: ${command.substring(0, 50)}...`);
        } catch (error) {
          // Ignorar erros de "já existe" ou similares
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('IF NOT EXISTS')) {
            console.log(`⚠️  Comando já aplicado ou ignorado: ${command.substring(0, 50)}...`);
          } else {
            console.error(`❌ Erro ao executar comando:`, error.message);
          }
        }
      }
    }
    
    console.log('✅ Migration aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  applyMigrationSQL()
    .then(() => {
      console.log('✅ Processo concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { applyMigrationSQL };

