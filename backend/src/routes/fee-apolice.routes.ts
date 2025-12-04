import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { feeApoliceSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /fees-apolice?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    const [data, total] = await Promise.all([
      prisma.feeApolice.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.feeApolice.count({ where })
    ]);

    // Se há apenas um resultado e foi solicitado por apoliceId, retornar o primeiro item diretamente
    if (apoliceId && data.length === 1) {
      return res.json(data[0]);
    }

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Erro ao listar fees:', error);
    res.status(500).json({ error: 'Erro ao listar fees', details: error.message });
  }
});

// GET /fees-apolice/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const fee = await prisma.feeApolice.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!fee) {
      return res.status(404).json({ error: 'Fee não encontrado' });
    }

    res.json(fee);
  } catch (error: any) {
    console.error('Erro ao buscar fee:', error);
    res.status(500).json({ error: 'Erro ao buscar fee', details: error.message });
  }
});

// POST /fees-apolice
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = feeApoliceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const apolice = await prisma.apolice.findFirst({
      where: {
        id: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    // Verificar se já existe fee para esta apólice
    const existing = await prisma.feeApolice.findUnique({
      where: { apoliceId: data.apoliceId }
    });

    let fee;
    if (existing) {
      fee = await prisma.feeApolice.update({
        where: { id: existing.id },
        data: {
          valorFeeMensal: data.valorFeeMensal !== undefined ? data.valorFeeMensal : existing.valorFeeMensal,
          feeConsultoria: data.feeConsultoria !== undefined ? data.feeConsultoria : existing.feeConsultoria,
          feeCorretorParceiro: data.feeCorretorParceiro !== undefined ? data.feeCorretorParceiro : existing.feeCorretorParceiro
        }
      });
    } else {
      fee = await prisma.feeApolice.create({
        data: {
          ...data,
          tenantId: req.tenantId!
        } as any
      });
    }

    res.status(201).json(fee);
  } catch (error: any) {
    console.error('Erro ao criar fee:', error);
    res.status(500).json({ error: 'Erro ao criar fee', details: error.message });
  }
});

// PUT /fees-apolice/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = feeApoliceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const existing = await prisma.feeApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Fee não encontrado' });
    }

    const fee = await prisma.feeApolice.update({
      where: { id },
      data: {
        valorFeeMensal: data.valorFeeMensal !== undefined ? data.valorFeeMensal : existing.valorFeeMensal,
        feeConsultoria: data.feeConsultoria !== undefined ? data.feeConsultoria : existing.feeConsultoria,
        feeCorretorParceiro: data.feeCorretorParceiro !== undefined ? data.feeCorretorParceiro : existing.feeCorretorParceiro
      }
    });

    res.json(fee);
  } catch (error: any) {
    console.error('Erro ao atualizar fee:', error);
    res.status(500).json({ error: 'Erro ao atualizar fee', details: error.message });
  }
});

// DELETE /fees-apolice/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const fee = await prisma.feeApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!fee) {
      return res.status(404).json({ error: 'Fee não encontrado' });
    }

    await prisma.feeApolice.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar fee:', error);
    res.status(500).json({ error: 'Erro ao deletar fee', details: error.message });
  }
});

export { router as feeApoliceRoutes };

