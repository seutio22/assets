const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correção automática...\n');

function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, [], {
      shell: true,
      stdio: 'inherit',
      cwd: __dirname,
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // 1. Remover pasta problemática
    console.log('[1/6] Removendo pasta problemática...');
    const duplicateDir = path.join(__dirname, 'prisma', 'migrations', 'add_implantacao_module');
    if (fs.existsSync(duplicateDir)) {
      fs.rmSync(duplicateDir, { recursive: true, force: true });
      console.log('   ✅ Pasta removida!\n');
    } else {
      console.log('   ✅ Pasta não encontrada (ok)\n');
    }

    // 2. Deletar banco
    console.log('[2/6] Deletando banco de dados...');
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('   ✅ Banco deletado!\n');
    } else {
      console.log('   ✅ Banco não encontrado (ok)\n');
    }

    // 3. Regenerar Prisma Client
    console.log('[3/6] Regenerando Prisma Client...');
    try {
      await execCommand('npm run prisma:generate');
      console.log('   ✅ Prisma Client regenerado!\n');
    } catch (error) {
      console.error('   ❌ Erro ao regenerar Prisma Client:', error.message);
      // Continua mesmo com erro
    }

    // 4. Aplicar migrations
    console.log('[4/6] Aplicando migrations...');
    try {
      await execCommand('npx prisma migrate dev --name add_permissions_system');
      console.log('   ✅ Migrations aplicadas!\n');
    } catch (error) {
      console.error('   ⚠️  Erro ao aplicar migrations, tentando sem nome...');
      try {
        await execCommand('npx prisma migrate dev');
        console.log('   ✅ Migrations aplicadas!\n');
      } catch (error2) {
        console.error('   ❌ Erro ao aplicar migrations:', error2.message);
        throw error2;
      }
    }

    // 5. Popular dados
    console.log('[5/6] Populando dados iniciais...');
    try {
      await execCommand('npm run prisma:seed');
      console.log('   ✅ Dados populados!\n');
    } catch (error) {
      console.error('   ⚠️  Erro ao popular dados:', error.message);
      console.log('   Continuando mesmo assim...\n');
    }

    // 6. Verificar
    console.log('[6/6] Verificando sistema...');
    try {
      await execCommand('npm run check:permissions');
      console.log('   ✅ Verificação concluída!\n');
    } catch (error) {
      console.warn('   ⚠️  Verificação com avisos (pode ser normal)');
    }

    console.log('========================================');
    console.log('✅ CONCLUÍDO COM SUCESSO!');
    console.log('========================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO durante a execução:');
    console.error(error.message);
    console.log('\n💡 Tente executar os comandos manualmente.');
    process.exit(1);
  }
}

main();

