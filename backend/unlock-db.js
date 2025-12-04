const { PrismaClient } = require('@prisma/client');

async function unlock() {
  const prisma = new PrismaClient();
  try {
    // Tentar uma query simples para forçar unlock
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Banco desbloqueado');
  } catch (error) {
    console.log('⚠️  Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

unlock();

