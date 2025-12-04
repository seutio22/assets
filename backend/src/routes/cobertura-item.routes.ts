import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { coberturaItemSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /cobertura-items?coberturaId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { coberturaId } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (coberturaId) where.coberturaId = coberturaId;

    const items = await prisma.coberturaItem.findMany({
      where,
      orderBy: { nome: 'asc' }
    });

    res.json({ data: items, total: items.length });
  } catch (error: any) {
    console.error('Erro ao listar itens de cobertura:', error);
    res.status(500).json({ error: 'Erro ao listar itens de cobertura', details: error.message });
  }
});

// GET /cobertura-items/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const item = await prisma.coberturaItem.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item de cobertura não encontrado' });
    }

    res.json(item);
  } catch (error: any) {
    console.error('Erro ao buscar item de cobertura:', error);
    res.status(500).json({ error: 'Erro ao buscar item de cobertura', details: error.message });
  }
});

// POST /cobertura-items
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = coberturaItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Verificar se a cobertura existe e pertence ao tenant
    const cobertura = await prisma.cobertura.findFirst({
      where: {
        id: data.coberturaId,
        tenantId: req.tenantId
      }
    });

    if (!cobertura) {
      return res.status(404).json({ error: 'Cobertura não encontrada' });
    }

    console.log('Criando item de cobertura:', JSON.stringify(data, null, 2));

    const item = await prisma.coberturaItem.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    console.log('Item de cobertura criado com sucesso:', item.id);
    res.status(201).json(item);
  } catch (error: any) {
    console.error('Erro ao criar item de cobertura:', error);
    res.status(500).json({ error: 'Erro ao criar item de cobertura', details: error.message });
  }
});

// PUT /cobertura-items/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = coberturaItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    const existing = await prisma.coberturaItem.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Item de cobertura não encontrado' });
    }

    console.log('Atualizando item de cobertura:', id, JSON.stringify(data, null, 2));

    const item = await prisma.coberturaItem.update({
      where: { id },
      data: {
        nome: data.nome,
        selecionado: data.selecionado,
        tipoValor: data.tipoValor,
        percentualTitular: data.percentualTitular,
        percentualConjuge: data.percentualConjuge,
        percentualFilhos: data.percentualFilhos,
        valorFixoTitular: data.valorFixoTitular,
        valorFixoConjuge: data.valorFixoConjuge,
        valorFixoFilhos: data.valorFixoFilhos
      }
    });

    console.log('Item de cobertura atualizado com sucesso:', item.id);
    res.json(item);
  } catch (error: any) {
    console.error('Erro ao atualizar item de cobertura:', error);
    res.status(500).json({ error: 'Erro ao atualizar item de cobertura', details: error.message });
  }
});

// DELETE /cobertura-items/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const item = await prisma.coberturaItem.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item de cobertura não encontrado' });
    }

    await prisma.coberturaItem.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar item de cobertura:', error);
    res.status(500).json({ error: 'Erro ao deletar item de cobertura', details: error.message });
  }
});

export { router as coberturaItemRoutes };

