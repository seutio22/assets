import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { contatoApoliceSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /contatos-apolice?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    const [data, total] = await Promise.all([
      prisma.contatoApolice.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contatoApolice.count({ where })
    ]);

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ error: 'Erro ao listar contatos', details: error.message });
  }
});

// GET /contatos-apolice/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contatoApolice.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json(contato);
  } catch (error: any) {
    console.error('Erro ao buscar contato:', error);
    res.status(500).json({ error: 'Erro ao buscar contato', details: error.message });
  }
});

// POST /contatos-apolice
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = contatoApoliceSchema.safeParse(req.body);
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

    const contato = await prisma.contatoApolice.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(contato);
  } catch (error: any) {
    console.error('Erro ao criar contato:', error);
    res.status(500).json({ error: 'Erro ao criar contato', details: error.message });
  }
});

// PUT /contatos-apolice/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = contatoApoliceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const existing = await prisma.contatoApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const contato = await prisma.contatoApolice.update({
      where: { id },
      data
    });

    res.json(contato);
  } catch (error: any) {
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato', details: error.message });
  }
});

// DELETE /contatos-apolice/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contatoApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    await prisma.contatoApolice.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({ error: 'Erro ao deletar contato', details: error.message });
  }
});

export { router as contatoApoliceRoutes };

