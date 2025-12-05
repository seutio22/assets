import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const grupoEconomicoSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres')
});

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /grupos-economicos
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      tenantId: req.tenantId
    };

    if (search && (search as string).trim() !== '') {
      where.name = { contains: (search as string).trim() };
    }

    // Logs removidos em produção para melhor performance
    if (process.env.NODE_ENV === 'development') {
      console.log('Buscando grupos econômicos com where:', JSON.stringify(where, null, 2));
      console.log('Tenant ID:', req.tenantId);
    }
    
    try {
      // Otimizar: buscar grupos sem empresas primeiro (mais rápido)
      const [data, total] = await Promise.all([
        prisma.grupoEconomico.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            name: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                empresas: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.grupoEconomico.count({ where })
      ]);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Encontrados ${data.length} grupos econômicos`);
    }

      res.json({
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (dbError: any) {
      console.error('Erro no banco de dados ao buscar grupos econômicos:', dbError);
      console.error('Stack trace:', dbError.stack);
      console.error('Error message:', dbError.message);
      console.error('Error code:', dbError.code);
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar grupos econômicos:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar grupos econômicos',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /grupos-economicos/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const grupo = await prisma.grupoEconomico.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        empresas: true
      }
    });

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo econômico não encontrado' });
    }

    res.json(grupo);
  } catch (error) {
    console.error('Erro ao buscar grupo econômico:', error);
    res.status(500).json({ error: 'Erro ao buscar grupo econômico' });
  }
});

// POST /grupos-economicos
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = grupoEconomicoSchema.parse(req.body);

    const grupo = await prisma.grupoEconomico.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any,
      include: {
        empresas: true
      }
    });

    res.status(201).json(grupo);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao criar grupo econômico:', error);
    res.status(500).json({ error: 'Erro ao criar grupo econômico' });
  }
});

// PUT /grupos-economicos/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = grupoEconomicoSchema.parse(req.body);

    const existing = await prisma.grupoEconomico.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Grupo econômico não encontrado' });
    }

    const grupo = await prisma.grupoEconomico.update({
      where: { id },
      data,
      include: {
        empresas: true
      }
    });

    res.json(grupo);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao atualizar grupo econômico:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo econômico' });
  }
});

// DELETE /grupos-economicos/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const grupo = await prisma.grupoEconomico.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo econômico não encontrado' });
    }

    await prisma.grupoEconomico.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar grupo econômico:', error);
    res.status(500).json({ error: 'Erro ao deletar grupo econômico' });
  }
});

export { router as grupoEconomicoRoutes };

