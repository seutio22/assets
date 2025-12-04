import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { clienteSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /clientes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      tenantId: req.tenantId
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { cnpj: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cliente.count({ where })
    ]);

    res.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
});

// GET /clientes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.cliente.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// POST /clientes
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = clienteSchema.parse(req.body);

    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(cliente);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /clientes/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = clienteSchema.parse(req.body);

    // Verificar se o cliente pertence ao tenant
    const existing = await prisma.cliente.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data
    });

    res.json(cliente);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// DELETE /clientes/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.cliente.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await prisma.cliente.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

export { router as clienteRoutes };

