const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔧 Correção Direta - Iniciando...\n');
console.log('📁 Diretório atual:', __dirname, '\n');

// 1. Remover pasta problemática
const duplicateDir = path.join(__dirname, 'prisma', 'migrations', 'add_implantacao_module');
if (fs.existsSync(duplicateDir)) {
  try {
    fs.rmSync(duplicateDir, { recursive: true, force: true });
    console.log('✅ Pasta removida\n');
  } catch (e) {
    console.log('⚠️  Erro ao remover pasta:', e.message, '\n');
  }
} else {
  console.log('✅ Pasta não encontrada (ok)\n');
}

// 2. Deletar banco
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('✅ Banco deletado\n');
  } catch (e) {
    console.log('⚠️  Erro ao deletar banco:', e.message, '\n');
  }
} else {
  console.log('✅ Banco não encontrado (ok)\n');
}

// 3. Executar comandos npm
const commands = [
  { cmd: 'npm run prisma:generate', name: 'Regenerar Prisma Client' },
  { cmd: 'npx prisma migrate dev', name: 'Aplicar Migrations' },
  { cmd: 'npm run prisma:seed', name: 'Popular Dados' }
];

function runCommand(cmd, name) {
  return new Promise((resolve) => {
    console.log(`🔄 ${name}...`);
    const proc = exec(cmd, { 
      cwd: __dirname,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      
      if (error) {
        console.log(`⚠️  ${name} - Erro:`, error.message);
        // Continua mesmo com erro
        resolve(false);
      } else {
        console.log(`✅ ${name} - Concluído\n`);
        resolve(true);
      }
    });
    
    // Timeout de 5 minutos por comando
    setTimeout(() => {
      if (!proc.killed) {
        console.log(`⏱️  ${name} - Timeout, continuando...\n`);
        proc.kill();
        resolve(false);
      }
    }, 300000);
  });
}

async function main() {
  for (const { cmd, name } of commands) {
    await runCommand(cmd, name);
  }
  
  console.log('========================================');
  console.log('✅ Processo concluído!');
  console.log('========================================');
}

main().catch(console.error);

