const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando apólices no banco...\n');
    
    const apolices = await prisma.apolice.findMany({
      select: {
        id: true,
        numero: true,
        produto: true,
        status: true,
        createdAt: true,
        tenant: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (apolices.length === 0) {
      console.log('❌ Nenhuma apólice encontrada no banco!\n');
      console.log('💡 Isso pode ter acontecido porque:');
      console.log('   1. O banco foi deletado durante a correção das migrations');
      console.log('   2. As apólices precisam ser cadastradas novamente\n');
    } else {
      console.log(`✅ ${apolices.length} apólice(s) encontrada(s):\n`);
      apolices.forEach((apolice, index) => {
        console.log(`${index + 1}. ${apolice.numero || 'Sem número'}`);
        console.log(`   Produto: ${apolice.produto || 'N/A'}`);
        console.log(`   Status: ${apolice.status || 'N/A'}`);
        console.log(`   Criada em: ${apolice.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   Tenant: ${apolice.tenant?.name || 'N/A'}`);
        console.log('');
      });
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

