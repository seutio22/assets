import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { coberturaSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /coberturas?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    const cobertura = await prisma.cobertura.findFirst({
      where,
      include: {
        items: {
          orderBy: { nome: 'asc' }
        }
      }
    });

    if (!cobertura) {
      return res.status(404).json({ error: 'Cobertura não encontrada' });
    }

    res.json(cobertura);
  } catch (error: any) {
    console.error('Erro ao buscar cobertura:', error);
    console.error('Stack trace:', error.stack);
    console.error('Query params:', req.query);
    res.status(500).json({ 
      error: 'Erro ao buscar cobertura', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /coberturas
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = coberturaSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Verificar se a apólice existe e pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: {
        id: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    // Verificar se já existe cobertura para esta apólice
    const existingCobertura = await prisma.cobertura.findFirst({
      where: {
        apoliceId: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (existingCobertura) {
      return res.status(400).json({ error: 'Já existe uma cobertura para esta apólice' });
    }

    // Verificar se já existe plano para esta apólice (mutuamente exclusivo)
    const existingPlano = await prisma.plano.findFirst({
      where: {
        apoliceId: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (existingPlano) {
      return res.status(400).json({ error: 'Já existe um plano para esta apólice. Plano e Cobertura são mutuamente exclusivos.' });
    }

    console.log('Criando cobertura com dados:', JSON.stringify(data, null, 2));

    const cobertura = await prisma.cobertura.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any,
      include: {
        items: true
      }
    });

    console.log('Cobertura criada com sucesso:', cobertura.id);
    res.status(201).json(cobertura);
  } catch (error: any) {
    console.error('Erro ao criar cobertura:', error);
    res.status(500).json({ error: 'Erro ao criar cobertura', details: error.message });
  }
});

// PUT /coberturas/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = coberturaSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    const existing = await prisma.cobertura.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Cobertura não encontrada' });
    }

    console.log('Atualizando cobertura:', id, JSON.stringify(data, null, 2));

    const cobertura = await prisma.cobertura.update({
      where: { id },
      data: {
        tipoMultiplicador: data.tipoMultiplicador,
        multiplicadorMin: data.multiplicadorMin,
        multiplicadorMax: data.multiplicadorMax,
        multiplo: data.multiplo,
        taxaAdm: data.taxaAdm
      },
      include: {
        items: true
      }
    });

    console.log('Cobertura atualizada com sucesso:', cobertura.id);
    res.json(cobertura);
  } catch (error: any) {
    console.error('Erro ao atualizar cobertura:', error);
    res.status(500).json({ error: 'Erro ao atualizar cobertura', details: error.message });
  }
});

// DELETE /coberturas/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const cobertura = await prisma.cobertura.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!cobertura) {
      return res.status(404).json({ error: 'Cobertura não encontrada' });
    }

    await prisma.cobertura.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar cobertura:', error);
    res.status(500).json({ error: 'Erro ao deletar cobertura', details: error.message });
  }
});

export { router as coberturaRoutes };

