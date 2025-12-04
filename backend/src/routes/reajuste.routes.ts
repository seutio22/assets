import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { reajusteSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /reajustes?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    try {
      const [data, total] = await Promise.all([
        prisma.reajuste.findMany({
          where,
          skip: parseInt(offset as string),
          take: parseInt(limit as string),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.reajuste.count({ where })
      ]);

      res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
    } catch (dbError: any) {
      console.error('Erro no banco de dados ao listar reajustes:', dbError);
      // Se for erro de schema não sincronizado, retornar array vazio
      if (dbError.message && (dbError.message.includes('Unknown column') || dbError.message.includes('no such column'))) {
        return res.json({ data: [], total: 0, limit: parseInt(limit as string), offset: parseInt(offset as string) });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar reajustes:', error);
    console.error('Stack trace:', error.stack);
    console.error('Query params:', req.query);
    res.status(500).json({ 
      error: 'Erro ao listar reajustes', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /reajustes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const reajuste = await prisma.reajuste.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!reajuste) {
      return res.status(404).json({ error: 'Reajuste não encontrado' });
    }

    res.json(reajuste);
  } catch (error: any) {
    console.error('Erro ao buscar reajuste:', error);
    res.status(500).json({ error: 'Erro ao buscar reajuste', details: error.message });
  }
});

// POST /reajustes
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = reajusteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: {
        id: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const reajuste = await prisma.reajuste.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(reajuste);
  } catch (error: any) {
    console.error('Erro ao criar reajuste:', error);
    res.status(500).json({ error: 'Erro ao criar reajuste', details: error.message });
  }
});

// PUT /reajustes/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = reajusteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    const existing = await prisma.reajuste.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reajuste não encontrado' });
    }

    const reajuste = await prisma.reajuste.update({
      where: { id },
      data
    });

    res.json(reajuste);
  } catch (error: any) {
    console.error('Erro ao atualizar reajuste:', error);
    res.status(500).json({ error: 'Erro ao atualizar reajuste', details: error.message });
  }
});

// DELETE /reajustes/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const reajuste = await prisma.reajuste.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!reajuste) {
      return res.status(404).json({ error: 'Reajuste não encontrado' });
    }

    await prisma.reajuste.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar reajuste:', error);
    res.status(500).json({ error: 'Erro ao deletar reajuste', details: error.message });
  }
});

export { router as reajusteRoutes };

