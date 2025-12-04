const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando usuários no banco...\n');
    
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco!\n');
      console.log('💡 Execute o seed para criar usuários:');
      console.log('   npm run prisma:seed\n');
    } else {
      console.log(`✅ ${usuarios.length} usuário(s) encontrado(s):\n`);
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.active ? 'Ativo' : 'Inativo'}`);
        console.log(`   Tenant: ${user.tenant?.name || 'N/A'}`);
        console.log('');
      });
      
      console.log('💡 Para fazer login, use um dos emails acima.');
      console.log('   A senha padrão é a que foi definida no seed.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.message.includes('locked')) {
      console.log('\n💡 Banco bloqueado. Aguarde alguns segundos e tente novamente.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verificar();


