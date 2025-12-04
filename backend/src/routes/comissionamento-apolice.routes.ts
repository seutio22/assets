import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { comissionamentoApoliceSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /comissionamentos-apolice?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    const [data, total] = await Promise.all([
      prisma.comissionamentoApolice.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.comissionamentoApolice.count({ where })
    ]);

    // Se há apenas um resultado e foi solicitado por apoliceId, retornar o primeiro item diretamente
    if (apoliceId && data.length === 1) {
      return res.json(data[0]);
    }

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Erro ao listar comissionamentos:', error);
    res.status(500).json({ error: 'Erro ao listar comissionamentos', details: error.message });
  }
});

// GET /comissionamentos-apolice/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const comissionamento = await prisma.comissionamentoApolice.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!comissionamento) {
      return res.status(404).json({ error: 'Comissionamento não encontrado' });
    }

    res.json(comissionamento);
  } catch (error: any) {
    console.error('Erro ao buscar comissionamento:', error);
    res.status(500).json({ error: 'Erro ao buscar comissionamento', details: error.message });
  }
});

// POST /comissionamentos-apolice
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = comissionamentoApoliceSchema.safeParse(req.body);
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

    // Verificar se já existe comissionamento para esta apólice
    const existing = await prisma.comissionamentoApolice.findUnique({
      where: { apoliceId: data.apoliceId }
    });

    let comissionamento;
    if (existing) {
      comissionamento = await prisma.comissionamentoApolice.update({
        where: { id: existing.id },
        data: {
          temCorretorParceiro: data.temCorretorParceiro !== undefined ? data.temCorretorParceiro : existing.temCorretorParceiro,
          valorAgenciamentoContrato: data.valorAgenciamentoContrato !== undefined ? data.valorAgenciamentoContrato : existing.valorAgenciamentoContrato,
          valorVitalicioContrato: data.valorVitalicioContrato !== undefined ? data.valorVitalicioContrato : existing.valorVitalicioContrato,
          agenciamentoConsultoria: data.agenciamentoConsultoria || null,
          vitalicioConsultoria: data.vitalicioConsultoria || null,
          agenciamentoCorretor: data.agenciamentoCorretor || null,
          vitalicioCorretor: data.vitalicioCorretor || null
        }
      });
    } else {
      comissionamento = await prisma.comissionamentoApolice.create({
        data: {
          ...data,
          temCorretorParceiro: data.temCorretorParceiro ?? false,
          tenantId: req.tenantId!
        } as any
      });
    }

    res.status(201).json(comissionamento);
  } catch (error: any) {
    console.error('Erro ao criar comissionamento:', error);
    res.status(500).json({ error: 'Erro ao criar comissionamento', details: error.message });
  }
});

// PUT /comissionamentos-apolice/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = comissionamentoApoliceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const existing = await prisma.comissionamentoApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comissionamento não encontrado' });
    }

    const comissionamento = await prisma.comissionamentoApolice.update({
      where: { id },
      data: {
        temCorretorParceiro: data.temCorretorParceiro !== undefined ? data.temCorretorParceiro : existing.temCorretorParceiro,
        valorAgenciamentoContrato: data.valorAgenciamentoContrato !== undefined ? data.valorAgenciamentoContrato : existing.valorAgenciamentoContrato,
        valorVitalicioContrato: data.valorVitalicioContrato !== undefined ? data.valorVitalicioContrato : existing.valorVitalicioContrato,
        agenciamentoConsultoria: data.agenciamentoConsultoria !== undefined ? (data.agenciamentoConsultoria || null) : existing.agenciamentoConsultoria,
        vitalicioConsultoria: data.vitalicioConsultoria !== undefined ? (data.vitalicioConsultoria || null) : existing.vitalicioConsultoria,
        agenciamentoCorretor: data.agenciamentoCorretor !== undefined ? (data.agenciamentoCorretor || null) : existing.agenciamentoCorretor,
        vitalicioCorretor: data.vitalicioCorretor !== undefined ? (data.vitalicioCorretor || null) : existing.vitalicioCorretor
      }
    });

    res.json(comissionamento);
  } catch (error: any) {
    console.error('Erro ao atualizar comissionamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar comissionamento', details: error.message });
  }
});

// DELETE /comissionamentos-apolice/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const comissionamento = await prisma.comissionamentoApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!comissionamento) {
      return res.status(404).json({ error: 'Comissionamento não encontrado' });
    }

    await prisma.comissionamentoApolice.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar comissionamento:', error);
    res.status(500).json({ error: 'Erro ao deletar comissionamento', details: error.message });
  }
});

export { router as comissionamentoApoliceRoutes };

