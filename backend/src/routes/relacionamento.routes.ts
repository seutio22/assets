import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { relacionamentoSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /relacionamentos
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', search = '', apoliceId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    if (search) {
      where.OR = [
        { executivo: { contains: search as string } },
        { coordenador: { contains: search as string } },
        { gerente: { contains: search as string } },
        { superintendente: { contains: search as string } },
        { diretoria: { contains: search as string } },
        { filial: { contains: search as string } },
        { celulaAtendimento: { contains: search as string } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.relacionamento.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          apolice: {
            select: { id: true, numero: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.relacionamento.count({ where })
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
  } catch (error: any) {
    console.error('Erro ao listar relacionamentos:', error);
    res.status(500).json({ 
      error: 'Erro ao listar relacionamentos', 
      details: error.message
    });
  }
});

// GET /relacionamentos/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const relacionamento = await prisma.relacionamento.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    });

    if (!relacionamento) {
      return res.status(404).json({ error: 'Relacionamento não encontrado' });
    }

    res.json(relacionamento);
  } catch (error: any) {
    console.error('Erro ao buscar relacionamento:', error);
    res.status(500).json({ error: 'Erro ao buscar relacionamento', details: error.message });
  }
});

// POST /relacionamentos
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const data = relacionamentoSchema.parse(req.body);

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: { id: data.apoliceId, tenantId: req.tenantId }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const relacionamento = await prisma.relacionamento.create({
      data: {
        apoliceId: data.apoliceId,
        executivo: data.executivo || null,
        coordenador: data.coordenador || null,
        gerente: data.gerente || null,
        superintendente: data.superintendente || null,
        diretoria: data.diretoria || null,
        filial: data.filial || null,
        celulaAtendimento: data.celulaAtendimento || null,
        tenantId: req.tenantId!
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    });

    res.status(201).json(relacionamento);
  } catch (error: any) {
    console.error('Erro ao criar relacionamento:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ 
      error: 'Erro ao criar relacionamento', 
      details: error.message
    });
  }
});

// PUT /relacionamentos/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = relacionamentoSchema.parse(req.body);

    const existing = await prisma.relacionamento.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Relacionamento não encontrado' });
    }

    // Verificar se a apólice pertence ao tenant (se foi alterada)
    if (data.apoliceId && data.apoliceId !== existing.apoliceId) {
      const apolice = await prisma.apolice.findFirst({
        where: { id: data.apoliceId, tenantId: req.tenantId }
      });

      if (!apolice) {
        return res.status(404).json({ error: 'Apólice não encontrada' });
      }
    }

    const relacionamento = await prisma.relacionamento.update({
      where: { id },
      data: {
        apoliceId: data.apoliceId,
        executivo: data.executivo || null,
        coordenador: data.coordenador || null,
        gerente: data.gerente || null,
        superintendente: data.superintendente || null,
        diretoria: data.diretoria || null,
        filial: data.filial || null,
        celulaAtendimento: data.celulaAtendimento || null
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    });

    res.json(relacionamento);
  } catch (error: any) {
    console.error('Erro ao atualizar relacionamento:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar relacionamento', details: error.message });
  }
});

// DELETE /relacionamentos/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const relacionamento = await prisma.relacionamento.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!relacionamento) {
      return res.status(404).json({ error: 'Relacionamento não encontrado' });
    }

    await prisma.relacionamento.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar relacionamento' });
  }
});

export { router as relacionamentoRoutes };

