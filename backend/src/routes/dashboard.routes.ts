import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /dashboard/stats - Retorna todas as estatísticas em uma única requisição
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const tenantId = req.tenantId;

    // Buscar todas as contagens em paralelo
    const [gruposCount, empresasCount, fornecedoresCount, apolicesCount, apolicesAtivasCount] = await Promise.all([
      prisma.grupoEconomico.count({ where: { tenantId } }),
      prisma.empresa.count({ where: { tenantId } }),
      prisma.fornecedor.count({ where: { tenantId } }),
      prisma.apolice.count({ where: { tenantId } }),
      prisma.apolice.count({ where: { tenantId, status: 'ATIVA' } })
    ]);

    res.json({
      data: {
        clientes: empresasCount,
        fornecedores: fornecedoresCount,
        apolices: apolicesCount,
        apolicesAtivas: apolicesAtivasCount
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message 
    });
  }
});

export { router as dashboardRoutes };

