// Script para aplicar migration automaticamente ao iniciar o servidor
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Verificando campos na tabela contatos...');
    
    // Verificar se a coluna dataNascimento existe
    const checkColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contatos' 
      AND column_name IN ('dataNascimento', 'ativo')
    `;
    
    const existingColumns = checkColumns.map((col: any) => col.column_name);
    const needsMigration = !existingColumns.includes('dataNascimento') || !existingColumns.includes('ativo');
    
    if (needsMigration) {
      console.log('📦 Aplicando migration para adicionar campos dataNascimento e ativo...');
      
      // Adicionar dataNascimento se não existir
      if (!existingColumns.includes('dataNascimento')) {
        await prisma.$executeRawUnsafe('ALTER TABLE "contatos" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP');
        console.log('✅ Coluna dataNascimento adicionada');
      }
      
      // Adicionar ativo se não existir
      if (!existingColumns.includes('ativo')) {
        await prisma.$executeRawUnsafe('ALTER TABLE "contatos" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true');
        console.log('✅ Coluna ativo adicionada');
        
        // Atualizar registros existentes
        await prisma.$executeRawUnsafe('UPDATE "contatos" SET "ativo" = true WHERE "ativo" IS NULL');
        console.log('✅ Registros existentes atualizados');
      }
      
      console.log('✅ Migration aplicada com sucesso!');
    } else {
      console.log('✅ Campos já existem, migration não necessária');
    }
  } catch (error) {
    console.error('⚠️  Erro ao aplicar migration (continuando mesmo assim):', error.message);
    // Não falhar o servidor se a migration falhar
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migration se chamado diretamente ou exportar para uso
if (require.main === module) {
  applyMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(0)); // Sempre sair com sucesso para não bloquear o servidor
}

module.exports = { applyMigration };

